/**
 * Maps a Wallet document to the safe shape returned across a wallet response.
 * Never returns a raw Mongoose doc (DTO-at-every-boundary).
 */
export function toWalletDTO(wallet) {
  return {
    balance: wallet.balance,
    updatedAt: wallet.updatedAt,
  };
}
