import React from 'react'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function getArtistAnalyticsMetrics(artistId: string) {
  const aggregateData = await db.platformLedger.aggregate({
    where: { booking: { artistId, status: 'DEPOSIT_HELD' } },
    _sum: { grossAmount: true, commissionFee: true, vendorPayout: true }
  })

  const activeBookingsCount = await db.booking.count({
    where: { artistId, status: 'DEPOSIT_HELD' }
  })

  return {
    grossVolume: Number(aggregateData._sum.grossAmount || 0),
    platformCommission: Number(aggregateData._sum.commissionFee || 0),
    netPayoutOwed: Number(aggregateData._sum.vendorPayout || 0),
    activeBookingsCount
  }
}

export default async function ArtistDashboardPage() {
  const analytics = await getArtistAnalyticsMetrics("target_artist_uuid_here")

  const metricCards = [
    { label: 'Gross Volume (MYR)', value: `RM ${analytics.grossVolume.toFixed(2)}`, color: 'text-indigo-600' },
    { label: 'Leish.my Commission (10%)', value: `RM ${analytics.platformCommission.toFixed(2)}`, color: 'text-slate-500' },
    { label: 'Net Pay (Owed Payouts)', value: `RM ${analytics.netPayoutOwed.toFixed(2)}`, color: 'text-emerald-600' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Artist Business Control Panel</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time marketplace revenue split metrics and ledger transparency.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metricCards.map((card, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-colors">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
            <h3 className={`text-2xl font-bold tracking-tight mt-3 ${card.color}`}>{card.value}</h3>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Monthly Revenue Velocity</h4>
          <div className="h-64 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-500">
            [ Time-Series Chart Render Container: Wire with Recharts or Chart.js here ]
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-slate-900 mb-4">Ecosystem Standings</h4>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Confirmed Booking Slots</span>
              <span className="text-slate-900 font-bold">{analytics.activeBookingsCount}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-[75%]" />
            </div>
            <p className="text-[11px] text-slate-400 italic mt-2">You are performing in the top 15% of verified local creators this quarter.</p>
          </div>
        </div>
      </div>
    </div>
  )
}