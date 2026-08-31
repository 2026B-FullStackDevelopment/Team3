/** Maps a Transaction document to its safe response shape. */
export function toTransactionDTO(transaction) {
  return {
    id: transaction._id,
    amount: transaction.amount,
    type: transaction.type,
    method: transaction.method ?? null,
    relatedReservationId: transaction.relatedReservationId ?? null,
    createdAt: transaction.createdAt,
  };
}

/** Maps a list of Transaction documents. */
export function toTransactionDTOList(transactions) {
  return transactions.map(toTransactionDTO);
}
