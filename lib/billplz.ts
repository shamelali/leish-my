const BILLPLZ_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://billplz.com'
  : 'https://billplz-sandbox.com'

export interface CreateBillOptions {
  email: string
  name: string
  amountInCents: number
  description: string
  callbackUrl: string
  redirectUrl: string
}

export async function createBillplzInvoice(options: CreateBillOptions) {
  const apiKey = process.env.BILLPLZ_API_KEY
  const collectionId = process.env.BILLPLZ_COLLECTION_ID

  if (!apiKey || !collectionId) {
    throw new Error('Missing critical Billplz configuration environment variables.')
  }

  const authHeader = Buffer.from(`${apiKey}:`).toString('base64')

  const response = await fetch(`${BILLPLZ_API_URL}/bills`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      collection_id: collectionId,
      email: options.email,
      name: options.name,
      amount: options.amountInCents,
      callback_url: options.callbackUrl,
      redirect_url: options.redirectUrl,
      description: options.description,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message || 'Failed to initialize Billplz gateway session')
  }

  return response.json()
}