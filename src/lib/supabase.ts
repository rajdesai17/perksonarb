import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database
export interface UserProfile {
  id: string
  wallet_address: string
  username: string
  jar_address?: string
  created_at: string
  updated_at: string
}

// Database functions
export const getUserProfile = async (walletAddress: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error)
    return null
  }
}

export const createUserProfile = async (
  walletAddress: string,
  username: string,
  jarAddress?: string
): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      wallet_address: walletAddress.toLowerCase(),
      username: username.toLowerCase(),
      jar_address: jarAddress?.toLowerCase(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating user profile:', error)
    return null
  }

  return data
}

export const updateJarAddress = async (
  walletAddress: string,
  jarAddress: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_profiles')
    .update({ jar_address: jarAddress.toLowerCase() })
    .eq('wallet_address', walletAddress.toLowerCase())

  if (error) {
    console.error('Error updating jar address:', error)
    return false
  }

  return true
}

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error('Error fetching user by username:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error in getUserByUsername:', error)
    return null
  }
}

export const getTotalUserCount = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error getting user count:', error)
    return 0
  }

  return count || 0
}

export const getRecentUsers = async (limit: number = 10): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent users:', error)
    return []
  }

  return data || []
}

export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .maybeSingle()

    if (error) {
      console.error('Error checking username availability:', error)
      return false
    }

    return !data // If no data found, username is available
  } catch (error) {
    console.error('Unexpected error in isUsernameAvailable:', error)
    return false
  }
}
