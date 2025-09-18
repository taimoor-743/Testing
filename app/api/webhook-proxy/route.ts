import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // Ensure this API route is dynamic

export async function POST(request: NextRequest) {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

    if (!n8nWebhookUrl) {
      console.error('N8N_WEBHOOK_URL is not set in environment variables.')
      return NextResponse.json({ error: 'N8N_WEBHOOK_URL is not configured' }, { status: 500 })
    }

    const body = await request.json()
    console.log('Received request for webhook proxy:', body)

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error from n8n webhook:', response.status, errorText)
      return NextResponse.json({ error: `n8n webhook failed: ${errorText}` }, { status: response.status })
    }

    const responseData = await response.json()
    console.log('Successfully sent to n8n webhook:', responseData)
    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('Error in webhook-proxy API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
