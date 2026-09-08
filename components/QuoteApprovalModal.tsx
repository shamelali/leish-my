'use client'

import React, { useState, useTransition } from 'react'
import { transitionQuoteToPayment } from '@/app/actions/bookings'

interface ModalProps {
  bookingId: string
  artistId: string
  clientEmail: string
  clientName: string
  quotedAmount: number
  travelFee: number
  requiredDeposit: number
  onClose: () => void
}

export default function QuoteApprovalModal({
  bookingId, artistId, clientEmail, clientName, quotedAmount, travelFee, requiredDeposit, onClose
}: ModalProps) {
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handlePaymentInitiation = () => {
    setErrorMsg(null)
    startTransition(async () => {
      const response = await transitionQuoteToPayment({
        bookingId, artistId, clientEmail, clientName, quotedAmount, travelFee, requiredDeposit
      })
      if (response.success && response.checkoutUrl) {
        window.location.href = response.checkoutUrl
      } else {
        setErrorMsg(response.message)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Review & Secure Deposit</h3>
        <p className="text-xs text-slate-500 mt-1">Review your booking breakdown before proceeding to online banking (FPX).</p>

        <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Service Quote</span>
            <span className="text-slate-900 font-medium">RM {quotedAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Travel Surcharge</span>
            <span className="text-slate-900 font-medium">RM {travelFee.toFixed(2)}</span>
          </div>
          <div className="h-px bg-slate-200 my-2" />
          <div className="flex justify-between items-center pt-1">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Required Escrow Deposit</span>
            <span className="text-lg font-bold text-emerald-600">RM {requiredDeposit.toFixed(2)}</span>
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs font-medium text-rose-600 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg">
            ⚠️ {errorMsg}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePaymentInitiation}
            disabled={isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-80"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Pay via Billplz'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}