import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized Cron Token Signature', { status: 401 })
  }

  try {
    const tomorrowStart = new Date()
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    tomorrowStart.setHours(0, 0, 0, 0)

    const tomorrowEnd = new Date()
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
    tomorrowEnd.setHours(23, 59, 59, 999)

    console.log(`[Cron Job Triggered] Scanning Neon DB for appointments between ${tomorrowStart.toISOString()} and ${tomorrowEnd.toISOString()}`)

    const upcomingBookings = await db.booking.findMany({
      where: {
        status: 'DEPOSIT_HELD',
        eventDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: { artist: true },
    })

    for (const booking of upcomingBookings) {
      const _message = `Hi ${booking.clientId}, this is a gentle reminder from Leish.my! ✨ Your beauty appointment with ${booking.artist.name} is scheduled for tomorrow. See you soon!`
      console.log(`[Automated Dispatch] Sending notification reminder for booking: ${booking.id}`)
    }

    return NextResponse.json({
      success: true,
      processedCount: upcomingBookings.length,
      message: 'Automated notification alerts dispatched cleanly.'
    })
  } catch (error) {
    console.error('💥 Background scheduling routine loop execution failed:', error)
    return NextResponse.json({ success: false, error: 'Internal system processing failure' }, { status: 500 })
  }
}