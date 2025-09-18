import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '../../../lib/supabase'

export const dynamic = 'force-dynamic' // Ensure this API route is dynamic

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received callback from n8n webhook:', body)

    const { id, status, outputLink, errorMessage } = body

    if (!id) {
      console.error('Callback missing required "id" field.')
      return NextResponse.json({ error: 'Missing ID in callback' }, { status: 400 })
    }

    // Update the project_usage record in Supabase
    const { data, error } = await UserService.updateProjectUsageStatus(id, status, outputLink, errorMessage)

    if (error) {
      console.error('Error updating project usage status in callback:', error)
      return NextResponse.json({ error: `Failed to update project usage: ${error.message}` }, { status: 500 })
    }

    console.log('Successfully updated project usage status:', data)
    return NextResponse.json({ message: 'Callback processed successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in n8n callback API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
