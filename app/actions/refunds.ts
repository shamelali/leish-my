'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export interface RefundPayload {
  bookingId: string
  artistId: string
  initiatedBy: 'OPERATOR' | 'ARTIST'
  reason: string
}

export async function processEscrowRefund(payload: RefundPayload) {
  try {
    console.log(`[Neon DB Security Fetch] Fetching Booking ${payload.bookingId}`)

    const targetBooking = await db.booking.findUnique({
      where: { id: payload.bookingId }
    })

    if (!targetBooking || targetBooking.status !== 'DEPOSIT_HELD') {
      return { success: false, message: 'Invalid operation. No held deposit found for reversal.' }
    }

    console.log(`[Neon DB Transaction] Reversing deposit state for ${payload.bookingId}`)
    await db.booking.update({
      where: { id: payload.bookingId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    })

    await db.refundAuditLog.create({
      data: {
        bookingId: payload.bookingId,
        initiatedBy: payload.initiatedBy,
        reason: payload.reason,
        amount: targetBooking.depositAmount || 0,
        processedAt: new Date()
      }
    })

    revalidatePath(`/client/bookings/${payload.bookingId}`)
    revalidatePath(`/artists/dashboard`)

    return {
      success: true,
      message: 'Escrow reversal logged. Balance routed back to the client\'s funding account.',
    }
  } catch (error) {
    console.error('💥 Escrow reversal execution loop failed:', error)
    return {
      success: false,
      message: 'System critical failure. Escrow transaction rollback aborted.',
    }
  }
}