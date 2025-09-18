// Session management utilities
export class SessionManager {
  private static SESSION_KEY = 'tekton_session_id'
  private static GOOGLE_DRIVE_KEY = 'tekton_google_drive_connected'
  private static USER_EMAIL_KEY = 'tekton_user_email'

  // Generate a unique session ID
  static generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  // Get current session ID or create a new one
  static getSessionId(): string {
    if (typeof window === 'undefined') return ''
    
    let sessionId = localStorage.getItem(this.SESSION_KEY)
    if (!sessionId) {
      sessionId = this.generateSessionId()
      localStorage.setItem(this.SESSION_KEY, sessionId)
    }
    return sessionId
  }

  // Check if user has Google Drive connected (from cookie)
  static hasGoogleDriveConnection(): boolean {
    if (typeof window === 'undefined') return false
    
    // Check cookie first (set by server)
    const cookies = document.cookie.split(';')
    const googleDriveCookie = cookies.find(cookie => 
      cookie.trim().startsWith('google_drive_connected=')
    )
    
    if (googleDriveCookie && googleDriveCookie.includes('true')) {
      return true
    }
    
    // Fallback to localStorage
    return localStorage.getItem(this.GOOGLE_DRIVE_KEY) === 'true'
  }

  // Set Google Drive connection status
  static setGoogleDriveConnection(connected: boolean): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.GOOGLE_DRIVE_KEY, connected.toString())
  }

  // Clear session data
  static clearSession(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.SESSION_KEY)
    localStorage.removeItem(this.GOOGLE_DRIVE_KEY)
    localStorage.removeItem(this.USER_EMAIL_KEY)
    
    // Clear Google Drive cookie
    document.cookie = 'google_drive_connected=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }

  // Get Google Drive credentials from localStorage
  static getGoogleDriveCredentials(): any {
    if (typeof window === 'undefined') return null
    const credentials = localStorage.getItem('tekton_google_drive_credentials')
    return credentials ? JSON.parse(credentials) : null
  }

  // Store Google Drive credentials
  static setGoogleDriveCredentials(credentials: any): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('tekton_google_drive_credentials', JSON.stringify(credentials))
  }

  // Get user ID for database operations
  static getUserId(): string {
    return this.getSessionId()
  }

  // Get user email for cross-device identification
  static getUserEmail(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.USER_EMAIL_KEY)
  }

  // Set user email for cross-device identification
  static setUserEmail(email: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.USER_EMAIL_KEY, email)
  }

  // Check if user has email (for cross-device persistence)
  static hasUserEmail(): boolean {
    return !!this.getUserEmail()
  }
}
