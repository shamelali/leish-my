import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Global">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">Leish.my</Link>
            </div>
            <div className="hidden md:flex md:items-center md:gap-8">
              <Link href="/artists" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Artists</Link>
              <Link href="/studios" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Studios</Link>
              <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Contact</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Sign in</Link>
              <Link href="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Get Started</Link>
            </div>
          </div>
        </nav>
      </header>

      <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
            Malaysia&apos;s Trusted Beauty<br />Booking Marketplace
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Book verified makeup artists and beauty professionals for weddings, events, and corporate sessions.
            Secure deposits, transparent pricing, and guaranteed quality.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/artists" className="rounded-lg bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 transition-colors">
              Browse Artists
            </Link>
            <Link href="/register" className="rounded-lg border border-slate-300 bg-white px-8 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Join as Artist
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          © 2024 Leish.my. All rights reserved.
        </div>
      </footer>
    </main>
  )
}