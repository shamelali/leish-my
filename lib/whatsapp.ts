export interface SendAlertOptions {
  recipientMobile: string
  artistName: string
  clientName: string
  eventDate: string
  depositAmount: number
}

export async function dispatchWhatsAppBookingAlert(options: SendAlertOptions) {
  const gatewayUrl = process.env.WHATSAPP_GATEWAY_URL || 'https://whatsapp-provider.com'
  const apiKey = process.env.WHATSAPP_API_TOKEN

  if (!apiKey) {
    console.warn('⚠️ WhatsApp API Token missing. Skipping live alert dispatch.')
    return { success: false, message: 'Configuration mismatch' }
  }

  const localizedMessage =
    `Hi ${options.artistName}, great news! 🎉\n\n` +
    `Your booking with *${options.clientName}* on *${options.eventDate}* has been secured.\n` +
    `An escrow deposit of *RM ${options.depositAmount.toFixed(2)}* has been safely collected via Billplz FPX.\n\n` +
    `Log into your Leish! Dashboard to view complete event specs: https://leish.my`

  try {
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.recipientMobile,
        type: 'text',
        text: { body: localizedMessage },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gateway returned HTTP response state: ${response.status}`)
    }

    console.log(`[WhatsApp Dispatch] Instant booking alert successfully pushed to MUA: ${options.recipientMobile}`)
    return { success: true }
  } catch (error) {
    console.error('❌ Failed to route live WhatsApp dispatch template payload:', error)
    return { success: false, error }
  }
}