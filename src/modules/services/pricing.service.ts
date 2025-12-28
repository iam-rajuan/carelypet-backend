export const calculateTotals = (
  subtotal: number,
  taxPercent: number
): { taxAmount: number; total: number } => {
  const taxAmount = Number(((subtotal * taxPercent) / 100).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));
  return { taxAmount, total };
};
