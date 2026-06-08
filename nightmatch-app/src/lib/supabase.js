import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vpcbmqkdckwjvocrlmlm.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwY2JtcWtkY2t3anZvY3JsbWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NTAyNDEsImV4cCI6MjA5NjUyNjI0MX0.O3TevLMDdETKpJR6gTp1kIf00volY14Hy3XglUx20S4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
})

// Auth helpers
export const signUp = (email, password, metadata) =>
  supabase.auth.signUp({ email, password, options: { data: metadata } })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getUser = () => supabase.auth.getUser()

// Venue helpers
export const getActiveVenues = async (lat, lng, radiusM = 10000) => {
  const { data, error } = await supabase
    .rpc('get_active_venues_nearby', { p_lat: lat, p_lng: lng, p_radius_m: radiusM })
  return { data, error }
}

export const getVenueById = async (id) => {
  const { data, error } = await supabase
    .from('venues')
    .select('*, nights(*), promotions(*)')
    .eq('id', id)
    .single()
  return { data, error }
}

// Checkin helpers
export const checkIn = async (userId, venueId, nightId) => {
  const { data, error } = await supabase
    .from('checkins')
    .upsert({ user_id: userId, venue_id: venueId, night_id: nightId, status: 'going' },
             { onConflict: 'user_id,night_id' })
    .select()
    .single()
  return { data, error }
}

export const getUsersGoingTonight = async (nightId) => {
  const { data, error } = await supabase
    .from('checkins')
    .select('*, profiles(id, name, age, avatar_url, music_prefs)')
    .eq('night_id', nightId)
    .in('status', ['going', 'arrived'])
  return { data, error }
}

// Matching helpers
export const sendLike = async (fromUserId, toUserId, venueId, nightId) => {
  const { data, error } = await supabase
    .from('likes')
    .insert({ from_user_id: fromUserId, to_user_id: toUserId, venue_id: venueId, night_id: nightId })
    .select()
    .single()
  return { data, error }
}

export const getMyMatches = async (userId) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      venues(name),
      nights(date, dj_name),
      user_a:profiles!matches_user_a_id_fkey(id, name, age, avatar_url, music_prefs),
      user_b:profiles!matches_user_b_id_fkey(id, name, age, avatar_url, music_prefs)
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return { data, error }
}

// Messages helpers
export const getMessages = async (matchId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, profiles(name, avatar_url)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })
  return { data, error }
}

export const sendMessage = async (matchId, senderId, content) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, content })
    .select()
    .single()
  return { data, error }
}

// Realtime subscriptions
export const subscribeToCheckins = (nightId, callback) =>
  supabase.channel(`checkins:${nightId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'checkins',
      filter: `night_id=eq.${nightId}`
    }, callback)
    .subscribe()

export const subscribeToMatches = (userId, callback) =>
  supabase.channel(`matches:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'matches'
    }, callback)
    .subscribe()

export const subscribeToMessages = (matchId, callback) =>
  supabase.channel(`messages:${matchId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
      filter: `match_id=eq.${matchId}`
    }, callback)
    .subscribe()

// Venue analytics
export const getVenueAnalytics = async (venueId, date) => {
  const { data, error } = await supabase
    .from('venue_analytics')
    .select('*')
    .eq('venue_id', venueId)
    .eq('date', date)
    .single()
  return { data, error }
}

export const getTonightCheckinCount = async (venueId) => {
  const { count, error } = await supabase
    .from('checkins')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', venueId)
    .in('status', ['going', 'arrived'])
  return { count, error }
}
