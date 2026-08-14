const MONEY_PRECISION = 100;

export function calculateFinalPrice(
  cost: number,
  desiredProfit: number,
  cardFeePercent: number,
  invoiceFeePercent: number
) {
  const values = [cost, desiredProfit, cardFeePercent, invoiceFeePercent];

  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    return null;
  }

  const totalFeePercent = cardFeePercent + invoiceFeePercent;

  if (totalFeePercent >= 100) {
    return null;
  }

  const feeFactor = 1 - totalFeePercent / 100;

  return Math.round(((cost + desiredProfit) / feeFactor) * MONEY_PRECISION) / MONEY_PRECISION;
}
