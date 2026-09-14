import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useAuth } from "@/context/auth/useAuth.js";
import { useNotificationSound } from "@/features/notification/Hook/useNotificationSound.js";
import {
  NOTIFICATION_TYPES,
  normalizeNotification,
} from "@/features/notification/Model/notificationModel.js";
import { notificationService } from "@/features/notification/Service/notificationService.js";
import { createNotificationSocket } from "@/features/notification/Service/notificationSocket.js";

const INITIAL_STATE = {
  entries: [],
  total: 0,
  page: 0,
  limit: 20,
  unreadCount: 0,
  status: "idle",
  socketStatus: "disconnected",
  error: null,
  toast: null,
};

function mergeEntries(existingEntries, incomingEntries) {
  return [
    ...new Map(
      [...existingEntries, ...incomingEntries].map((entry) => [
        entry.id,
        entry,
      ]),
    ).values(),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function reducer(state, action) {
  switch (action.type) {
    case "reset":
      return INITIAL_STATE;
    case "load-start":
      return {
        ...state,
        status: state.entries.length ? "ready" : "loading",
        error: null,
      };
    case "load-success": {
      const entries = mergeEntries(state.entries, action.entries);
      return {
        ...state,
        entries,
        total: Math.max(action.total, entries.length),
        page: Math.max(state.page, action.page),
        limit: action.limit,
        status: "ready",
        error: null,
      };
    }
    case "load-error":
      return {
        ...state,
        status: state.entries.length ? "ready" : "error",
        error: action.message,
      };
    case "count-success":
      return { ...state, unreadCount: Math.max(0, action.count) };
    case "socket-status":
      return { ...state, socketStatus: action.status };
    case "receive":
      return {
        ...state,
        entries: mergeEntries(state.entries, [action.notification]),
        total: state.total + 1,
        unreadCount: state.unreadCount + (action.notification.isRead ? 0 : 1),
        toast: action.notification,
      };
    case "dismiss-toast":
      return { ...state, toast: null };
    case "mark-one":
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.id ? { ...entry, isRead: true } : entry,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case "restore-one":
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.id ? { ...entry, isRead: false } : entry,
        ),
        unreadCount: state.unreadCount + 1,
        error: action.message,
      };
    case "mark-all":
      return {
        ...state,
        entries: state.entries.map((entry) =>
          action.ids.has(entry.id) ? { ...entry, isRead: true } : entry,
        ),
        unreadCount: 0,
      };
    case "restore-many":
      return {
        ...state,
        entries: state.entries.map((entry) =>
          action.ids.has(entry.id) ? { ...entry, isRead: false } : entry,
        ),
        unreadCount: state.unreadCount + action.previousUnreadCount,
        error: action.message,
      };
    default:
      return state;
  }
}

function errorMessage(result, fallback) {
  return result?.error?.message ?? result?.data?.message ?? fallback;
}

export function useNotificationFeed() {
  const { user, status: authStatus, role } = useAuth();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const seenIds = useRef(new Set());
  const generationRef = useRef(0);
  const activeRequestRef = useRef({ sessionKey: null, generation: 0 });
  const {
    enabled: soundEnabled,
    blocked: soundBlocked,
    enable: enableSound,
    play: playSound,
    stop: stopSound,
    toggle: toggleSound,
  } = useNotificationSound();
  const playSoundRef = useRef(playSound);

  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);
  const enabledForRole =
    authStatus === "authenticated" &&
    (role === "Donor" || role === "Recipient");
  const sessionKey = enabledForRole ? `${user?.id}:${role}` : null;

  const isCurrentRequest = useCallback(
    ({ sessionKey: requestSessionKey, generation }) =>
      Boolean(requestSessionKey) &&
      activeRequestRef.current.sessionKey === requestSessionKey &&
      generationRef.current === generation,
    [],
  );

  const currentRequest = useCallback(() => activeRequestRef.current, []);

  const loadPage = useCallback(
    async (page = 1, request = currentRequest()) => {
      if (!isCurrentRequest(request)) return false;
      dispatch({ type: "load-start" });
      const result = await notificationService.list({ page, limit: 20 });
      if (!isCurrentRequest(request)) return false;
      if (!result.ok) {
        dispatch({
          type: "load-error",
          message: errorMessage(result, "Notifications could not be loaded."),
        });
        return false;
      }
      const entries = (result.data?.entries ?? [])
        .map(normalizeNotification)
        .filter(Boolean);
      entries.forEach((entry) => seenIds.current.add(entry.id));
      dispatch({
        type: "load-success",
        entries,
        total: Number(result.data?.total) || entries.length,
        page: Number(result.data?.page) || page,
        limit: Number(result.data?.limit) || 20,
      });
      return true;
    },
    [currentRequest, isCurrentRequest],
  );

  const refreshCount = useCallback(
    async (request = currentRequest()) => {
      if (!isCurrentRequest(request)) return false;
      const result = await notificationService.unreadCount();
      if (!isCurrentRequest(request)) return false;
      if (result.ok)
        dispatch({
          type: "count-success",
          count: Number(result.data?.count) || 0,
        });
      return result.ok;
    },
    [currentRequest, isCurrentRequest],
  );
  const refresh = useCallback(
    async (request = currentRequest()) => {
      await Promise.all([loadPage(1, request), refreshCount(request)]);
    },
    [currentRequest, loadPage, refreshCount],
  );

  useEffect(() => {
    const generation = ++generationRef.current;
    const request = { sessionKey, generation };
    activeRequestRef.current = request;
    let active = true;
    const isCurrent = () => active && isCurrentRequest(request);

    seenIds.current.clear();
    stopSound();
    dispatch({ type: "reset" });
    if (!sessionKey) return undefined;

    const socket = createNotificationSocket();
    const handleConnect = () => {
      if (isCurrent()) {
        dispatch({ type: "socket-status", status: "connected" });
        refresh(request);
      }
    };
    const handleDisconnect = () => {
      if (isCurrent())
        dispatch({ type: "socket-status", status: "disconnected" });
    };
    const handleConnectError = () => {
      if (isCurrent()) dispatch({ type: "socket-status", status: "error" });
    };
    const handleNotification = (payload) => {
      const notification = normalizeNotification(payload);
      if (!isCurrent() || !notification || seenIds.current.has(notification.id))
        return;
      seenIds.current.add(notification.id);
      dispatch({ type: "receive", notification });
      if (notification.type === NOTIFICATION_TYPES.LISTING_SOLD_OUT)
        playSoundRef.current(notification.id);
    };
    dispatch({ type: "socket-status", status: "connecting" });
    loadPage(1, request);
    refreshCount(request);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("notification:created", handleNotification);
    socket.connect();
    return () => {
      active = false;
      if (generationRef.current === generation) {
        generationRef.current += 1;
        activeRequestRef.current = {
          sessionKey: null,
          generation: generationRef.current,
        };
      }
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [isCurrentRequest, loadPage, refresh, refreshCount, sessionKey, stopSound]);

  const markRead = useCallback(
    async (id) => {
      const entry = state.entries.find((item) => item.id === id);
      if (!entry || entry.isRead) return true;
      dispatch({ type: "mark-one", id });
      const request = currentRequest();
      const result = await notificationService.markRead(id);
      if (result.ok) return true;
      if (!isCurrentRequest(request)) return false;
      dispatch({
        type: "restore-one",
        id,
        message: errorMessage(
          result,
          "The notification could not be marked as read.",
        ),
      });
      return false;
    },
    [currentRequest, isCurrentRequest, state.entries],
  );
  const selectNotification = useCallback(
    (notification) => markRead(notification.id),
    [markRead],
  );

  const markAllRead = useCallback(async () => {
    const ids = new Set(
      state.entries.filter((entry) => !entry.isRead).map((entry) => entry.id),
    );
    const previousUnreadCount = state.unreadCount;
    if (previousUnreadCount === 0) return true;
    dispatch({ type: "mark-all", ids });
    const request = currentRequest();
    const result = await notificationService.markAllRead();
    if (result.ok) return true;
    if (!isCurrentRequest(request)) return false;
    dispatch({
      type: "restore-many",
      ids,
      previousUnreadCount,
      message: errorMessage(
        result,
        "Notifications could not be marked as read.",
      ),
    });
    return false;
  }, [currentRequest, isCurrentRequest, state.entries, state.unreadCount]);

  const loadMore = useCallback(() => {
    if (state.entries.length >= state.total || state.status === "loading")
      return;
    loadPage(state.page + 1);
  }, [loadPage, state.entries.length, state.page, state.status, state.total]);
  const dismissToast = useCallback(
    () => dispatch({ type: "dismiss-toast" }),
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      hasMore: state.entries.length < state.total,
      markRead,
      selectNotification,
      markAllRead,
      loadMore,
      refresh,
      soundEnabled,
      soundBlocked,
      enableSound,
      toggleSound,
    }),
    [
      enableSound,
      loadMore,
      markAllRead,
      markRead,
      refresh,
      selectNotification,
      soundBlocked,
      soundEnabled,
      state,
      toggleSound,
    ],
  );
  return { value, toast: state.toast, dismissToast };
}
