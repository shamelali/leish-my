import { db } from '@/lib/db'

export interface SplitCalcOptions {
  bookingId: string
  grossAmount: number
  commissionRate: number
}

export async function logPlatformSplit(options: SplitCalcOptions) {
  const { bookingId, grossAmount, commissionRate } = options

  const commissionFee = grossAmount * commissionRate
  const vendorPayout = grossAmount - commissionFee

  console.log(`[Ledger Calculation] Booking: ${bookingId} | Gross: RM${grossAmount} | Commission: RM${commissionFee} | MUA Net: RM${vendorPayout}`)

  return await db.platformLedger.create({
    data: {
      bookingId,
      grossAmount,
      commissionFee,
      vendorPayout,
      payoutStatus: 'PENDING',
    }
  })
}