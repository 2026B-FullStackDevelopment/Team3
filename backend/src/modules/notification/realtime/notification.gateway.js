import { Server } from "socket.io";

import { env } from "../../../config/env.js";
import * as identity from "../../identity/index.js";

let socketServer;

function readCookie(cookieHeader, cookieName) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== cookieName) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

async function authenticateSocket(socket, next) {
  try {
    const token = readCookie(socket.request.headers.cookie, env.cookie.name);
    if (!token) return next(new Error("Authentication required"));

    const payload = identity.verifyAccessToken(token);
    if (await identity.isRevoked(payload.jti)) {
      return next(new Error("Invalid or expired session"));
    }

    const account = await identity.loadAuthUser(payload.userId);
    if (!account || account.accountStatus !== identity.AccountStatus.Active) {
      return next(new Error("Invalid or expired session"));
    }

    socket.data.userId = String(payload.userId);
    socket.data.role = account.role;
    return next();
  } catch {
    return next(new Error("Invalid or expired session"));
  }
}

export function initializeNotificationGateway(httpServer) {
  socketServer = new Server(httpServer, {
    cors: {
      origin: env.realtime.corsOrigin,
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: env.realtime.recoveryWindowMs,
      skipMiddlewares: false,
    },
  });

  socketServer.use(authenticateSocket);
  socketServer.on("connection", (socket) => {
    socket.join(`user:${socket.data.userId}`);
    // TEMP diagnostic: which userId room this socket joined (compare with the
    // emit target logged in publishNotifications).
    console.log(
      "[socket] connected — joined room user:%s (role: %s)",
      socket.data.userId,
      socket.data.role,
    );
  });

  return socketServer;
}

export function publishNotifications(notifications) {
  if (!socketServer) return;
  const results = Array.isArray(notifications)
    ? notifications
    : [notifications];

  for (const result of results.filter(Boolean)) {
    const isCreationResult =
      typeof result === "object" &&
      Object.prototype.hasOwnProperty.call(result, "created") &&
      Object.prototype.hasOwnProperty.call(result, "notification");
    if (isCreationResult && !result.created) continue;

    const notification = isCreationResult ? result.notification : result;
    if (!notification) continue;

    // TEMP diagnostic: what room we emit to, whether anyone is in it, and the
    // created flag. roomSize 0 => userId mismatch (join id != emit id).
    const room = `user:${notification.userId}`;
    console.log(
      "[socket] emit → %s | roomSize: %d | created: %s",
      room,
      socketServer.sockets.adapter.rooms.get(room)?.size ?? 0,
      isCreationResult ? result.created : "n/a",
    );

    socketServer.to(room).emit("notification:created", notification);
  }
}

export async function closeNotificationGateway() {
  if (!socketServer) return;
  await new Promise((resolve) => socketServer.close(resolve));
  socketServer = undefined;
}
