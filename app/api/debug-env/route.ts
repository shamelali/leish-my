import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercel: !!process.env.VERCEL,
    keys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DIRECT') || k.includes('VERCEL')),
  })
}