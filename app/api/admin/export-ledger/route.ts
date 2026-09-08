import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_EXPORT_SECRET}`) {
    return new NextResponse('Unauthorized Ledger Access Handshake', { status: 403 })
  }

  try {
    const logs = await db.platformLedger.findMany({
      orderBy: { createdAt: 'desc' },
      include: { booking: true }
    })

    let csvContent = 'Transaction_ID,Booking_ID,Gross_Amount_MYR,Commission_Fee_MYR,Vendor_Payout_MYR,Payout_Status,Created_At\n'

    logs.forEach((log) => {
      csvContent += `${log.id},${log.bookingId},${Number(log.grossAmount).toFixed(2)},${Number(log.commissionFee).toFixed(2)},${Number(log.vendorPayout).toFixed(2)},${log.payoutStatus},${log.createdAt.toISOString().split('T')[0]}\n`
    })

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=leish_financial_ledger_${new Date().toISOString().split('T')[0]}.csv`,
      },
    })
  } catch (error) {
    console.error('💥 Failed to generate ledger export payload download file stream:', error)
    return NextResponse.json({ success: false, error: 'Ledger generation aborted' }, { status: 500 })
  }
}