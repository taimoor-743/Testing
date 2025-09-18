import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for RLS operations (server-side only)
export const supabaseService = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

// Database structure interfaces
export interface User {
  id: string
  email: string
  name?: string
  google_user_id?: string
  session_id?: string
  created_at: string
  updated_at: string
  last_active?: string
}

export interface GoogleDriveConnection {
  id: string
  user_id: string
  client_id: string
  client_secret: string
  access_token: string
  refresh_token?: string
  token_expires_at?: string
  scope?: string
  google_email?: string
  is_active: boolean
  error_message?: string
  retry_count?: number
  last_error_at?: string
  created_at: string
  updated_at: string
  last_used?: string
}

export interface Project {
  id: string
  user_id: string
  project_name: string
  business_details?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  user_id: string
  project_id: string
  request_type: string
  request_data?: any
  response_data?: any
  status: string
  created_at: string
  updated_at: string
}

// UserService class for database operations
export class UserService {
  // Get or create user by email
  static async getOrCreateUserByEmail(email: string, name?: string, googleUserId?: string): Promise<User> {
    console.log('getOrCreateUserByEmail called with:', { email, name, googleUserId })
    
    // First try to get existing user
    const { data: existingUser, error: fetchError } = await (supabaseService || supabase)
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser && !fetchError) {
      console.log('Found existing user:', { id: existingUser.id, email: existingUser.email })
      return existingUser
    }

    // If user doesn't exist, create new one
    console.log('Creating new user for email:', email)
    const { data: newUser, error: createError } = await (supabaseService || supabase)
      .from('users')
      .insert({
        email,
        name: name || null,
        google_user_id: googleUserId || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      // Handle unique constraint violation (email already exists)
      if (createError.code === '23505' && createError.message.includes('email')) {
        console.log('User with this email already exists, fetching existing user...')
        // Try to fetch the existing user again
        const { data: existingUser, error: fetchError2 } = await (supabaseService || supabase)
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
        
        if (existingUser && !fetchError2) {
          console.log('Found existing user after conflict:', { id: existingUser.id, email: existingUser.email })
          return existingUser
        }
      }
      throw new Error(`Failed to create user: ${createError.message}`)
    }

    console.log('Created new user:', { id: newUser.id, email: newUser.email })
    return newUser
  }

  // Save Google Drive connection with client_id and client_secret
  static async saveGoogleDriveConnection(credentials: any): Promise<void> {
    console.log('saveGoogleDriveConnection called with credentials:', {
      hasAccessToken: !!credentials.access_token,
      hasRefreshToken: !!credentials.refresh_token,
      hasExpiresAt: !!credentials.expires_at,
      hasScope: !!credentials.scope,
      hasUserInfo: !!credentials.user_info,
      userEmail: credentials.user_info?.email,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    })
    
    // Get user info from Google OAuth response
    const email = credentials.user_info?.email
    const name = credentials.user_info?.name
    const googleUserId = credentials.user_info?.id
    
    if (!email) {
      console.error('No email found in Google OAuth response:', credentials.user_info)
      throw new Error('No email found in Google OAuth response')
    }
    
    // Create or get user by email
    const user = await this.getOrCreateUserByEmail(email, name, googleUserId)
    console.log('User retrieved for Google Drive connection:', { id: user.id, email: user.email })

    // Validate required fields before inserting
    if (!credentials.access_token) {
      throw new Error('Access token is required but not provided')
    }
    
    if (!credentials.user_info?.email) {
      throw new Error('User email is required but not provided')
    }

    // Prepare the connection data - Store ALL credentials including client_id and client_secret
    const connectionData = {
      user_id: user.id,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      access_token: credentials.access_token, // Required field
      refresh_token: credentials.refresh_token || null,
      token_expires_at: credentials.expires_at || (credentials.expires_in 
        ? new Date(Date.now() + credentials.expires_in * 1000).toISOString()
        : null),
      scope: credentials.scope || null,
      google_email: credentials.user_info.email, // Required field - no fallback to null
      is_active: true
    }
    
    console.log('Upserting Google Drive connection data:', {
      user_id: connectionData.user_id,
      client_id: connectionData.client_id ? 'Set' : 'Missing',
      client_secret: connectionData.client_secret ? 'Set' : 'Missing',
      google_email: connectionData.google_email,
      has_access_token: !!connectionData.access_token,
      has_refresh_token: !!connectionData.refresh_token,
      token_expires_at: connectionData.token_expires_at
    })

    // Use upsert with ON CONFLICT to handle existing connections
    // This will update existing connection or insert new one
    const { data: upsertedData, error } = await (supabaseService || supabase)
      .from('google_drive_connections')
      .upsert(connectionData, {
        onConflict: 'google_email', // Use the unique constraint on google_email
        ignoreDuplicates: false // Update existing records
      })
      .select()

    if (error) {
      console.error('Error upserting Google Drive connection:', {
        error: error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        errorCode: error.code,
        connectionData: {
          ...connectionData,
          client_secret: connectionData.client_secret ? '[HIDDEN]' : 'Missing'
        }
      })
      
      // Handle specific database errors
      if (error.code === '23505') {
        throw new Error(`Database constraint violation: ${error.message}. This usually means a duplicate entry.`)
      } else if (error.code === '23503') {
        throw new Error(`Foreign key constraint violation: ${error.message}. User might not exist.`)
      } else if (error.code === '23502') {
        throw new Error(`Not null constraint violation: ${error.message}. Required field is missing.`)
      } else {
        throw new Error(`Failed to save Google Drive connection: ${error.message}`)
      }
    }
    
    console.log('Google Drive connection upserted successfully for user:', user.email)
    console.log('Upserted connection data:', upsertedData)
  }

  // Check if user has Google Drive connection (by email)
  static async hasGoogleDriveConnection(email?: string): Promise<boolean> {
    try {
      if (email) {
        // Use email-based identification
        const { data, error } = await (supabaseService || supabase)
          .from('google_drive_connections')
          .select('id')
          .eq('google_email', email)
          .eq('is_active', true)
          .or(`token_expires_at.is.null,token_expires_at.gt.${new Date().toISOString()}`)
          .single()

        if (error) {
          // If no connection found, that's fine
          if (error.code === 'PGRST116') {
            return false
          }
          console.error('Error checking Google Drive connection:', error)
          return false
        }

        return !!data
      } else {
        return false
      }
    } catch (error) {
      console.error('Error in hasGoogleDriveConnection:', error)
      return false
    }
  }

  // Get Google Drive connection (by email)
  static async getGoogleDriveConnection(email?: string): Promise<GoogleDriveConnection | null> {
    try {
      if (email) {
        // Use email-based identification
        const { data, error } = await (supabaseService || supabase)
          .from('google_drive_connections')
          .select('*')
          .eq('google_email', email)
          .eq('is_active', true)
          .or(`token_expires_at.is.null,token_expires_at.gt.${new Date().toISOString()}`)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            return null
          }
          console.error('Error getting Google Drive connection:', error)
          return null
        }

        return data
      } else {
        return null
      }
    } catch (error) {
      console.error('Error in getGoogleDriveConnection:', error)
      return null
    }
  }

  // Get or create user (session-based)
  static async getOrCreateUser(): Promise<User> {
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('tekton_session_id') : null
    if (!sessionId) {
      throw new Error('No session found')
    }

    const { data: user, error } = await (supabaseService || supabase)
      .from('users')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (error || !user) {
      throw new Error('User not found')
    }

    return user
  }

  // Get user projects
  static async getUserProjects(): Promise<Project[]> {
    const user = await this.getOrCreateUser()
    
    const { data: projects, error } = await (supabaseService || supabase)
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user projects:', error)
      return []
    }

    return projects || []
  }

  // Create project
  static async createProject(projectName: string, businessDetails: string, userEmail?: string): Promise<Project> {
    let user: User
    
    if (userEmail) {
      user = await this.getOrCreateUserByEmail(userEmail)
    } else {
      user = await this.getOrCreateUser()
    }
    
    const { data: project, error } = await (supabaseService || supabase)
      .from('projects')
      .insert({
        user_id: user.id,
        project_name: projectName,
        business_details: businessDetails
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw new Error(`Failed to create project: ${error.message}`)
    }

    return project
  }

  // Create project usage
  static async createProjectUsage(
    projectId: string, 
    requestType: string, 
    requestData: any, 
    responseData: any,
    status: string,
    userEmail?: string
  ): Promise<any> {
    let user: User
    
    if (userEmail) {
      user = await this.getOrCreateUserByEmail(userEmail)
    } else {
      user = await this.getOrCreateUser()
    }
    
    const { data: usage, error } = await (supabaseService || supabase)
      .from('project_usage')
      .insert({
        user_id: user.id,
        project_id: projectId,
        request_type: requestType,
        request_data: requestData,
        response_data: responseData,
        status: status,
        website_structure: requestData?.website_structure,
        error_message: responseData?.error_message,
        output_link: responseData?.output_link
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project usage:', error)
      throw new Error(`Failed to create project usage: ${error.message}`)
    }

    return usage
  }

  // Get user project usage
  static async getUserProjectUsage(): Promise<any[]> {
    const user = await this.getOrCreateUser()
    
    const { data: usage, error } = await (supabaseService || supabase)
      .from('project_usage')
      .select(`
        *,
        projects (
          project_name,
          business_details
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user project usage:', error)
      return []
    }

    return usage || []
  }

  // Update project usage status
  static async updateProjectUsageStatus(id: string, status: string, outputLink?: string, errorMessage?: string): Promise<any> {
    const updateData: any = { status }
    
    if (outputLink) {
      updateData.output_link = outputLink
    }
    
    if (errorMessage) {
      updateData.error_message = errorMessage
    }

    const { data, error } = await (supabaseService || supabase)
      .from('project_usage')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating project usage status:', error)
      throw new Error(`Failed to update project usage status: ${error.message}`)
    }

    return data
  }
}