import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
})

// ── Auth ──────────────────────────────────────────────────
export const signUp = (email, password, metadata) =>
  supabase.auth.signUp({ email, password, options: { data: metadata } })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

// ── Profiles ──────────────────────────────────────────────
export const getProfile = (userId) =>
  supabase.from('profiles').select('*').eq('id', userId).single()

export const updateProfile = (userId, data) =>
  supabase.from('profiles').update(data).eq('id', userId)

// ── Venues ────────────────────────────────────────────────
export const getActiveVenues = async (lat, lng, radiusM = 20000) => {
  const { data, error } = await supabase
    .rpc('get_active_venues_nearby', { p_lat: lat, p_lng: lng, p_radius_m: radiusM })
  return { data, error }
}

export const getVenueById = async (id) => {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export const updateVenue = (id, data) =>
  supabase.from('venues').update(data).eq('id', id)

// ── Nights ────────────────────────────────────────────────
export const getTonightForVenue = async (venueId) => {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('nights')
    .select('*')
    .eq('venue_id', venueId)
    .eq('date', today)
    .eq('is_active', true)
    .single()
  return { data, error }
}

export const createNight = (data) =>
  supabase.from('nights').insert(data).select().single()

export const updateNight = (id, data) =>
  supabase.from('nights').update(data).eq('id', id)

// ── Events ────────────────────────────────────────────────
export const getVenueEvents = async (venueId, nightId) => {
  let q = supabase.from('events').select('*').eq('venue_id', venueId).eq('is_active', true)
  if (nightId) q = q.eq('night_id', nightId)
  return q.order('start_time', { ascending: true })
}

export const createEvent = (data) =>
  supabase.from('events').insert(data).select().single()

export const updateEvent = (id, data) =>
  supabase.from('events').update(data).eq('id', id)

export const deleteEvent = (id) =>
  supabase.from('events').update({ is_active: false }).eq('id', id)

// ── Promotions ────────────────────────────────────────────
export const getPromosForNight = async (nightId) => {
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .eq('night_id', nightId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const createPromo = (data) =>
  supabase.from('promotions').insert(data).select().single()

export const updatePromo = (id, data) =>
  supabase.from('promotions').update(data).eq('id', id)

// ── Ads ───────────────────────────────────────────────────
export const getVenueAds = async (venueId) => {
  const { data, error } = await supabase
    .from('venue_ads')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_active', true)
  return { data, error }
}

export const createAd = (data) =>
  supabase.from('venue_ads').insert(data).select().single()

export const deleteAd = (id) =>
  supabase.from('venue_ads').update({ is_active: false }).eq('id', id)

// ── Venue Admins ──────────────────────────────────────────
export const getMyAdminVenues = async (userId) => {
  const { data, error } = await supabase
    .from('venue_admins')
    .select('venue_id, venues(*)')
    .eq('user_id', userId)
  return { data, error }
}

export const isVenueAdmin = async (venueId, userId) => {
  const { data } = await supabase
    .from('venue_admins')
    .select('id')
    .eq('venue_id', venueId)
    .eq('user_id', userId)
    .single()
  return !!data
}

// ── Checkins ──────────────────────────────────────────────
export const checkIn = async (userId, venueId, nightId) => {
  const { data, error } = await supabase
    .from('checkins')
    .upsert(
      { user_id: userId, venue_id: venueId, night_id: nightId, status: 'going' },
      { onConflict: 'user_id,night_id' }
    )
    .select()
    .single()
  return { data, error }
}

export const getCheckinStatus = async (userId, nightId) => {
  const { data } = await supabase
    .from('checkins')
    .select('status')
    .eq('user_id', userId)
    .eq('night_id', nightId)
    .single()
  return data?.status || null
}

export const getUsersGoingTonight = async (nightId) => {
  const { data, error } = await supabase
    .from('checkins')
    .select('*, profiles(id, name, age, avatar_url, music_prefs, drink_prefs)')
    .eq('night_id', nightId)
    .in('status', ['going', 'arrived'])
  return { data, error }
}

// ── Likes ─────────────────────────────────────────────────
export const sendLike = async (fromUserId, toUserId, venueId, nightId) => {
  const { data, error } = await supabase
    .from('likes')
    .insert({ from_user_id: fromUserId, to_user_id: toUserId, venue_id: venueId, night_id: nightId })
    .select()
    .single()
  return { data, error }
}

export const getMyLikesThisNight = async (userId, nightId) => {
  const { data } = await supabase
    .from('likes')
    .select('to_user_id')
    .eq('from_user_id', userId)
    .eq('night_id', nightId)
  return (data || []).map(l => l.to_user_id)
}

// ── Matches ───────────────────────────────────────────────
export const getMyMatches = async (userId) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      venues(name),
      nights(date, dj_name),
      user_a:profiles!matches_user_a_id_fkey(id, name, age, avatar_url, music_prefs, drink_prefs),
      user_b:profiles!matches_user_b_id_fkey(id, name, age, avatar_url, music_prefs, drink_prefs)
    `)
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return { data, error }
}

export const checkMatch = async (userId, targetId, nightId) => {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .or(`and(user_a_id.eq.${userId},user_b_id.eq.${targetId}),and(user_a_id.eq.${targetId},user_b_id.eq.${userId})`)
    .eq('night_id', nightId)
    .single()
  return data
}

// ── Messages ──────────────────────────────────────────────
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

// ── Realtime ──────────────────────────────────────────────
export const subscribeToCheckins = (nightId, cb) =>
  supabase.channel(`checkins:${nightId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'checkins', filter: `night_id=eq.${nightId}` }, cb)
    .subscribe()

export const subscribeToMatches = (userId, cb) =>
  supabase.channel(`matches:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches' }, cb)
    .subscribe()

export const subscribeToMessages = (matchId, cb) =>
  supabase.channel(`messages:${matchId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` }, cb)
    .subscribe()
