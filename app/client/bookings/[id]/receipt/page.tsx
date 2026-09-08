import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getBookingStatusFromNeon(bookingId: string) {
  // Mock data - replace with actual DB query
  return {
    id: bookingId,
    status: 'DEPOSIT_HELD',
    clientName: 'Sarah Lin',
    artistName: 'Aisha Azman',
    depositPaid: 150.00,
    referenceId: 'BPZ9874102',
    eventDate: 'Saturday, November 14, 2026'
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentReceiptPage({ params }: PageProps) {
  const resolvedParams = await params
  const booking = await getBookingStatusFromNeon(resolvedParams.id)

  if (!booking) {
    notFound()
  }

  const isSuccessful = booking.status === 'DEPOSIT_HELD'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
        {isSuccessful ? (
          <>
            <div className="mx-auto w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4 animate-bounce">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Slot Secured Successfully!</h2>
            <p className="text-sm text-slate-500 mt-1">Your wedding calendar date is now locked in escrow.</p>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 bg-amber-100 border border-amber-300 text-amber-600 rounded-full flex items-center justify-center text-3xl mb-4 animate-spin">
              ⚡
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Processing Bank Clearing...</h2>
            <p className="text-sm text-slate-500 mt-1">We are verifying your FPX transaction pipeline state.</p>
          </>
        )}

        <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3.5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Platform Ref ID</span>
            <span className="text-slate-700 font-mono text-xs">{booking.referenceId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Assigned Professional</span>
            <span className="text-slate-900 font-semibold">{booking.artistName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Target Event Date</span>
            <span className="text-slate-700 font-medium text-xs">{booking.eventDate}</span>
          </div>
          <div className="h-px bg-slate-200 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Deposit Deducted (FPX)</span>
            <span className="text-base font-bold text-emerald-600">RM {booking.depositPaid.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2.5">
          <Link
            href={`/client/bookings/${booking.id}`}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 block"
          >
            Track Appointment Details
          </Link>
          <Link
            href="/"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl text-sm transition-colors block"
          >
            Return to Marketplace Home
          </Link>
        </div>
      </div>
    </div>
  )
}