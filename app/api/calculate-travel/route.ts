import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { artistLocation: _artistLocation, clientLocation: _clientLocation } = await request.json()
    const mockDistanceKm = 35
    const freeRadius = 15
    const ratePerKm = 1.50

    const travelFee = mockDistanceKm > freeRadius ? (mockDistanceKm - freeRadius) * ratePerKm : 0
    return NextResponse.json({ success: true, travelFee })
  } catch {
    return NextResponse.json({ success: false, travelFee: 0 }, { status: 500 })
  }
}