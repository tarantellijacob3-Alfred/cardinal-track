export interface Database {
  public: {
    Tables: {
      teams: {
        Row: Team
        Insert: TeamInsert
        Update: TeamUpdate
      }
      athletes: {
        Row: Athlete
        Insert: AthleteInsert
        Update: AthleteUpdate
      }
      events: {
        Row: TrackEvent
        Insert: TrackEventInsert
        Update: TrackEventUpdate
      }
      meets: {
        Row: Meet
        Insert: MeetInsert
        Update: MeetUpdate
      }
      meet_entries: {
        Row: MeetEntry
        Insert: MeetEntryInsert
        Update: MeetEntryUpdate
      }
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
      }
      favorites: {
        Row: Favorite
        Insert: FavoriteInsert
        Update: FavoriteUpdate
      }
      tfrrs_meet_links: {
        Row: TFRRSMeetLink
        Insert: TFRRSMeetLinkInsert
        Update: TFRRSMeetLinkUpdate
      }
    }
  }
}

export interface Team {
  id: string
  name: string
  slug: string
  school_name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  stripe_subscription_id: string | null
  is_grandfathered: boolean
  active: boolean
  created_at: string
}

export type TeamInsert = Omit<Team, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type TeamUpdate = Partial<TeamInsert>

export interface Athlete {
  id: string
  first_name: string
  last_name: string
  grade: number | null
  level: 'JV' | 'Varsity'
  gender: 'Boys' | 'Girls'
  active: boolean
  team_id: string
  tfrrs_url: string | null
  created_at: string
}

export type AthleteInsert = Omit<Athlete, 'id' | 'created_at' | 'tfrrs_url'> & {
  id?: string
  created_at?: string
  tfrrs_url?: string | null
}

export type AthleteUpdate = Partial<AthleteInsert>

export interface TrackEvent {
  id: string
  name: string
  short_name: string
  category: 'Field' | 'Sprint' | 'Distance' | 'Hurdles' | 'Relay' | 'Other'
  max_entries: number
  is_relay: boolean
}

export type TrackEventInsert = Omit<TrackEvent, 'id'> & { id?: string }
export type TrackEventUpdate = Partial<TrackEventInsert>

export interface Meet {
  id: string
  name: string
  date: string
  location: string | null
  level: 'JV' | 'Varsity' | 'Both'
  notes: string | null
  team_id: string
  created_at: string
}

export type MeetInsert = Omit<Meet, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type MeetUpdate = Partial<MeetInsert>

export interface MeetEntry {
  id: string
  meet_id: string
  athlete_id: string
  event_id: string
  relay_leg: number | null
  relay_team: 'A' | 'Alt' | null
  created_at: string
}

export type MeetEntryInsert = Omit<MeetEntry, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type MeetEntryUpdate = Partial<MeetEntryInsert>

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'coach' | 'parent' | 'athlete'
  approved: boolean
  team_id: string | null
  created_at: string
}

export type ProfileInsert = Omit<Profile, 'created_at'> & {
  created_at?: string
}

export type ProfileUpdate = Partial<ProfileInsert>

// Favorites
export interface Favorite {
  id: string
  profile_id: string
  athlete_id: string
  created_at: string
}

export type FavoriteInsert = Omit<Favorite, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type FavoriteUpdate = Partial<FavoriteInsert>

// TFRRS Meet Links
export interface TFRRSMeetLink {
  id: string
  meet_id: string
  tfrrs_url: string
  created_at: string
}

export type TFRRSMeetLinkInsert = Omit<TFRRSMeetLink, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type TFRRSMeetLinkUpdate = Partial<TFRRSMeetLinkInsert>

// Extended types for joined queries
export interface MeetEntryWithDetails extends MeetEntry {
  athletes: Athlete
  events: TrackEvent
}

export interface MeetWithEntryCount extends Meet {
  entry_count?: number
}

export type EventCategory = TrackEvent['category']
