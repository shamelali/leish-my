'use server'

import { revalidatePath } from 'next/cache'
import { createBillplzInvoice } from '@/lib/billplz'
import { db } from '@/lib/db'

export interface ProcessQuotePayload {
  bookingId: string
  artistId: string
  clientEmail: string
  clientName: string
  quotedAmount: number
  requiredDeposit: number
  travelFee: number
}

export async function transitionQuoteToPayment(payload: ProcessQuotePayload) {
  try {
    const totalAmount = payload.quotedAmount + payload.travelFee
    const depositInCents = Math.round(payload.requiredDeposit * 100)

    const bill = await createBillplzInvoice({
      email: payload.clientEmail,
      name: payload.clientName,
      amountInCents: depositInCents,
      description: `Leish.my Booking Secure Deposit (ID: ${payload.bookingId})`,
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/billplz`,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/client/bookings/${payload.bookingId}/receipt`,
    })

    console.log(`[Neon DB Update] Linking Billplz Invoice Reference: ${bill.id}`)
    await db.booking.update({
      where: { id: payload.bookingId, artistId: payload.artistId },
      data: {
        status: 'QUOTE_RETURNED',
        quotedAmount: totalAmount,
        depositAmount: payload.requiredDeposit,
        travelFee: payload.travelFee,
        billplzInvoiceId: bill.id,
      }
    })

    revalidatePath(`/client/bookings/${payload.bookingId}`)
    revalidatePath(`/artists/dashboard`)

    return {
      success: true,
      checkoutUrl: bill.url,
      message: 'Invoice created successfully. Launching FPX payment platform Gateway.',
    }
  } catch (error: unknown) {
    console.error('Marketplace checkout compilation error:', error)
    return {
      success: false,
      checkoutUrl: null,
      message: error instanceof Error ? error.message : 'Server failed to process gateway transaction routing.',
    }
  }
}