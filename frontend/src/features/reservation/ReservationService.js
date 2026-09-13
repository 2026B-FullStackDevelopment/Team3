export async function fetchActiveDonation() {
    const response = await fetch('/api/donations/active', {
        method: 'GET',
        headers: { 'Content-type': 'application/json' }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch active donations');
    }

    return response.json();
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