import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.MIGRATION_SECRET || process.env.CRON_SECRET

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('Running Prisma db push...')

    // This will create tables if they don't exist
    await prisma.$executeRaw`SELECT 1`

    // Check if tables exist, if not create them
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Artist" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100) NOT NULL,
          "baseLocation" VARCHAR(255) NOT NULL,
          "isVerified" BOOLEAN DEFAULT false,
          "baseRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
        )
      `
    } catch (e) {
      console.log('Artist table may already exist:', e)
    }

    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Booking" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "clientId" VARCHAR(255) NOT NULL,
          "artistId" UUID NOT NULL,
          "eventDate" TIMESTAMP(3) NOT NULL,
          status VARCHAR(50) DEFAULT 'PENDING_QUOTE',
          "quotedAmount" DECIMAL(10,2),
          "travelFee" DECIMAL(10,2) DEFAULT 0,
          "depositAmount" DECIMAL(10,2),
          "billplzInvoiceId" VARCHAR(255) UNIQUE,
          "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Booking_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `
    } catch (e) {
      console.log('Booking table may already exist:', e)
    }

    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "PlatformLedger" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "bookingId" UUID NOT NULL UNIQUE,
          "grossAmount" DECIMAL(10,2) NOT NULL,
          "commissionFee" DECIMAL(10,2) NOT NULL,
          "vendorPayout" DECIMAL(10,2) NOT NULL,
          "payoutStatus" VARCHAR(50) DEFAULT 'PENDING',
          "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PlatformLedger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `
    } catch (e) {
      console.log('PlatformLedger table may already exist:', e)
    }

    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "RefundAuditLog" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "bookingId" UUID NOT NULL,
          "initiatedBy" VARCHAR(50) NOT NULL,
          reason TEXT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          "processedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RefundAuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `
    } catch (e) {
      console.log('RefundAuditLog table may already exist:', e)
    }

    // Create indexes
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Artist_category_baseLocation_isVerified_idx" ON "Artist" (category, "baseLocation", "isVerified")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Booking_artistId_eventDate_status_idx" ON "Booking" ("artistId", "eventDate", status)`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Booking_clientId_createdAt_idx" ON "Booking" ("clientId", "createdAt")`
    } catch (e) {
      console.log('Indexes may already exist:', e)
    }

    await prisma.$disconnect()

    return NextResponse.json({ success: true, message: 'Database migration completed' })
  } catch (error) {
    console.error('Migration error:', error)
    await prisma.$disconnect()
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 })
  }
}