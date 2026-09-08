import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { logPlatformSplit } from '@/lib/accounting'
import { dispatchWhatsAppBookingAlert } from '@/lib/whatsapp'

function verifyBillplzSignature(params: Record<string, string>, receivedSignature: string): boolean {
  const signKey = process.env.BILLPLZ_X_SIGNATURE_KEY
  if (!signKey) return false

  const sortedKeys = Object.keys(params).sort()
  const sourceString = sortedKeys.map((key) => `${key}${params[key]}`).join('|')
  const calculatedSignature = crypto.createHmac('sha256', signKey).update(sourceString).digest('hex')

  return calculatedSignature === receivedSignature
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const payload: Record<string, string> = {}
    formData.forEach((value, key) => { payload[key] = value.toString() })

    const { id: billId, paid, x_signature } = payload

    const isValidRequest = verifyBillplzSignature(payload, x_signature)
    if (!isValidRequest) {
      console.warn('❌ [Security Alert] Invalid Billplz X-Signature rejected.')
      return new NextResponse('Unauthorized Cryptographic Payload Signature', { status: 401 })
    }

    const isPaymentSuccessful = paid === 'true'
    if (!isPaymentSuccessful) {
      console.log(`[Billplz Lifecycle] Bill reference ID ${billId} status logged as: UNPAID`)
      return NextResponse.json({ received: true, processed: false })
    }

    console.log(`✅ [Billplz Webhook Verified] Payment cleared successfully for bill reference: ${billId}`)

    const updatedBooking = await db.booking.update({
      where: { billplzInvoiceId: billId },
      data: {
        status: 'DEPOSIT_HELD',
        updatedAt: new Date(),
      },
    })

    if (updatedBooking.depositAmount) {
      await logPlatformSplit({
        bookingId: updatedBooking.id,
        grossAmount: Number(updatedBooking.depositAmount),
        commissionRate: 0.10,
      })
    }

    const artist = await db.artist.findUnique({ where: { id: updatedBooking.artistId } })
    if (artist) {
      await dispatchWhatsAppBookingAlert({
        recipientMobile: '+60123456789',
        artistName: artist.name,
        clientName: 'Client',
        eventDate: updatedBooking.eventDate.toLocaleDateString(),
        depositAmount: Number(updatedBooking.depositAmount || 0),
      })
    }

    revalidatePath(`/client/bookings/${updatedBooking.id}`)
    revalidatePath(`/artists/dashboard`)

    return NextResponse.json({ received: true, updated: true }, { status: 200 })
  } catch (error) {
    console.error('💥 Error compiling Billplz platform webhook event routing loop:', error)
    return new NextResponse('Internal Webhook System Compilation Error', { status: 500 })
  }
}