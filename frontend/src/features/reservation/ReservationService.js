import { httpClient } from '@/shared/api/apiFetch.js';
import { donationRoutes } from '@/config/api/routes/index.js';

function requireData(result, fallback) {
    if (result.ok) return result.data;
    throw new Error(result.error?.message || fallback);
}

export async function createCheckoutSession(donationId, quantity) {
    return httpClient.post('/api/reservations/checkout', { donationId, quantity });
}

export async function fetchActiveDonation(location) {
    const result = await httpClient.get(donationRoutes.active, {
        params: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
        } : undefined,
    });
    return requireData(result, 'Failed to fetch active donations');
}

export async function fetchActiveDonationById(donationId) {
    const result = await httpClient.get(donationRoutes.activeListing(donationId));
    const data = requireData(result, 'This food listing is no longer available.');
    return data.listing;
}

export async function fetchWalletBalance() {
    const response = await fetch('/api/wallet', {
        method: 'GET',
        headers: { 'Content-type': 'application/json' }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch wallet balance');
    }

    const data = await response.json();
    return data.wallet.balance;
}

export async function createReservation(reservationData) {
    const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(reservationData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create reservation');
    }

    return response.json();
}

export async function fetchReservationHistory() {
    // Calls the existing backend route: GET /api/reservations/history
    const response = await fetch('/api/reservations/history', {
        method: 'GET',
        headers: { 'Content-type': 'application/json' }
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch reservation history');
    }
    
    return response.json();
}
