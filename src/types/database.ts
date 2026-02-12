export interface Database {
  public: {
    Tables: {
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
    }
  }
}

export interface Athlete {
  id: string
  first_name: string
  last_name: string
  grade: number | null
  level: 'JV' | 'Varsity'
  gender: 'Boys' | 'Girls'
  active: boolean
  created_at: string
}

export type AthleteInsert = Omit<Athlete, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
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
  created_at: string
}

export type ProfileInsert = Omit<Profile, 'created_at'> & {
  created_at?: string
}

export type ProfileUpdate = Partial<ProfileInsert>

// Extended types for joined queries
export interface MeetEntryWithDetails extends MeetEntry {
  athletes: Athlete
  events: TrackEvent
}

export interface MeetWithEntryCount extends Meet {
  entry_count?: number
}

export type EventCategory = TrackEvent['category']
