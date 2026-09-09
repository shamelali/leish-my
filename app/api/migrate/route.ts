import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const databaseUrl = process.env.DATABASE_URL

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.MIGRATION_SECRET || process.env.CRON_SECRET

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!databaseUrl) {
    return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrl }
    }
  })

  try {
    console.log('Running database migration...')

    // Test connection
    await prisma.$executeRaw`SELECT 1`

    // Create tables
    const statements = [
      // Artist table
      `CREATE TABLE IF NOT EXISTS "Artist" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        "baseLocation" VARCHAR(255) NOT NULL,
        "isVerified" BOOLEAN DEFAULT false,
        "baseRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`,
      // Booking table
      `CREATE TABLE IF NOT EXISTS "Booking" (
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
      )`,
      // PlatformLedger table
      `CREATE TABLE IF NOT EXISTS "PlatformLedger" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bookingId" UUID NOT NULL UNIQUE,
        "grossAmount" DECIMAL(10,2) NOT NULL,
        "commissionFee" DECIMAL(10,2) NOT NULL,
        "vendorPayout" DECIMAL(10,2) NOT NULL,
        "payoutStatus" VARCHAR(50) DEFAULT 'PENDING',
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PlatformLedger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"(id) ON DELETE RESTRICT ON UPDATE CASCADE
      )`,
      // RefundAuditLog table
      `CREATE TABLE IF NOT EXISTS "RefundAuditLog" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bookingId" UUID NOT NULL,
        "initiatedBy" VARCHAR(50) NOT NULL,
        reason TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        "processedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RefundAuditLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"(id) ON DELETE RESTRICT ON UPDATE CASCADE
      )`
    ]

    for (const sql of statements) {
      try {
        await prisma.$executeRawUnsafe(sql)
      } catch (e: any) {
        if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) {
          console.log('Statement note:', e.message)
        }
      }
    }

    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "Artist_category_baseLocation_isVerified_idx" ON "Artist" (category, "baseLocation", "isVerified")`,
      `CREATE INDEX IF NOT EXISTS "Booking_artistId_eventDate_status_idx" ON "Booking" ("artistId", "eventDate", status)`,
      `CREATE INDEX IF NOT EXISTS "Booking_clientId_createdAt_idx" ON "Booking" ("clientId", "createdAt")`
    ]

    for (const sql of indexes) {
      try {
        await prisma.$executeRawUnsafe(sql)
      } catch (e: any) {
        if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) {
          console.log('Index note:', e.message)
        }
      }
    }

    await prisma.$disconnect()

    return NextResponse.json({ success: true, message: 'Database migration completed' })
  } catch (error) {
    console.error('Migration error:', error)
    await prisma.$disconnect()
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 })
  }
}