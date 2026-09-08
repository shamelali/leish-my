'use client'

import React from 'react'

interface LocalizedEvent {
  id: string
  clientName: string
  status: 'DEPOSIT_HELD' | 'QUOTE_RETURNED' | 'PENDING_QUOTE'
  eventTime: string
}

interface CalendarGridProps {
  currentMonthName: string
  daysData: {
    dayNumber: number
    isCurrentMonth: boolean
    events: LocalizedEvent[]
  }[]
}

export default function ArtistCalendarGrid({ currentMonthName, daysData }: CalendarGridProps) {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 text-slate-900 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">{currentMonthName}</h3>
        <div className="flex gap-2">
          <span className="text-xs px-2.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full font-medium">
            ● Confirmed Slots
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysData.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-24 p-2 rounded-xl border flex flex-col justify-between transition-all ${
              day.isCurrentMonth
                ? 'bg-slate-50/40 border-slate-200/80 hover:border-slate-300'
                : 'bg-slate-50/10 border-slate-100 text-slate-400 pointer-events-none'
            }`}
          >
            <span className="text-xs font-bold text-slate-500 self-end">{day.dayNumber}</span>
            <div className="space-y-1 mt-1">
              {day.events.map((event) => {
                const isConfirmed = event.status === 'DEPOSIT_HELD'
                return (
                  <div
                    key={event.id}
                    className={`text-[10px] p-1.5 rounded font-medium border truncate ${
                      isConfirmed
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}
                    title={`${event.clientName} (${event.eventTime})`}
                  >
                    {event.eventTime} {event.clientName}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}