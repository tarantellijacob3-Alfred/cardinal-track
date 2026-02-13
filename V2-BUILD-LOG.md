# V2 Build Log — Multi-Team Foundation

**Built:** 2025-07-11 (Phases 1/2/4/6), 2025-07-12 (Phases 5/7/8), 2025-07-13 (UX Overhaul)  
**Phases Completed:** 1 (Foundation), 2 (URL Routing), 4 (CSV Upload), 5 (Parent Signup + Favorites), 6 (Mobile Polish), 7 (Team Onboarding + Stripe), 8 (TFRRS Auto-Linking), **UX Overhaul** (TrackBoard branding, team-scoped auth, favorites on dashboard)  
**Build Status:** ✅ Compiles & builds successfully with zero errors  
**Deployment:** LOCAL ONLY — NOT deployed to Vercel  

---

## UX Overhaul (2025-07-13): TrackBoard Platform Brand, Team-Scoped Auth, Favorites on Dashboard

### 1. Landing Page → "TrackBoard" Platform Brand + Team Directory

**File: `src/pages/Landing.tsx` — Complete rewrite**

- Rebranded from "Cardinal Track" to **"TrackBoard"** — a platform for track teams, not a specific team
- NO references to Cardinal Track or Bishop Snyder on the landing page
- **Team Directory**: Fetches all active teams from Supabase, displays as cards with:
  - Team name, school name, color gradient swatch
  - Logo (or initials fallback)
  - Link to `/t/[slug]`
- **"Find Your Team"** search/filter on the directory section
- Hero section: "Your Track Team, Organized" — explains what TrackBoard is
- CTAs: "Start Your Team — Free" (→ /onboard), "Find Your Team" (→ #directory)
- Parent/athlete CTA links to directory (team-specific signup)
- Flash message support via `?message=` URL parameter (for redirects from /login etc.)
- Updated footer: "TrackBoard — Track & Field Team Management Platform"

**File: `index.html`**
- Title changed to "TrackBoard | Track & Field Team Manager"
- Meta description updated

### 2. Team-Scoped Sign In / Register / Parent Signup

**New files:**
| File | Purpose |
|------|---------|
| `src/pages/TeamLogin.tsx` | Team-scoped login at `/t/:slug/login`. Shows team branding (logo, name, colors). Redirects to team dashboard after login. Links to team-scoped register and parent-signup. |
| `src/pages/TeamRegister.tsx` | Team-scoped coach registration at `/t/:slug/register`. Sets `profile.team_id` to the current team on registration. Shows team name in UI. Pending approval flow preserved. |
| `src/pages/TeamParentSignup.tsx` | Team-scoped parent signup at `/t/:slug/parent-signup`. Auto-assigns to current team (no team dropdown needed). Auto-approved as parent role. |

**Route changes (`src/App.tsx`):**
- `/login` → redirects to `/?message=Select a team first, then sign in from their page.`
- `/register` → redirects to `/?message=Select a team first, then register from their page.`
- `/parent-signup` → redirects to `/?message=Select a team first, then sign up from their page.`
- `/t/:slug/login` → `TeamLogin` (wrapped in `TeamProvider`, no Layout)
- `/t/:slug/register` → `TeamRegister` (wrapped in `TeamProvider`, no Layout)
- `/t/:slug/parent-signup` → `TeamParentSignup` (wrapped in `TeamProvider`, no Layout)
- `/onboard` → kept global (creating a new team isn't team-scoped)
- Old Login.tsx, Register.tsx, ParentSignup.tsx kept as files but no longer imported

### 3. Favorites Integrated on Dashboard

**File: `src/pages/Dashboard.tsx` — Major update**

- When a logged-in parent/athlete has favorited athletes:
  - Shows **"⭐ My Athletes"** section at the TOP of the dashboard (before search, stats, meets)
  - Displays each favorited athlete as a card with: name, level, grade, gender
  - Shows upcoming meets & events for each favorited athlete inline
  - "+ Add more" link to search page
- If no favorites yet: friendly prompt card — "⭐ Favorite athletes to see their updates here" with "Search Athletes" CTA
- Section only visible to non-coach users (parents/athletes)
- Coaches see same dashboard as before (no favorites section)
- Existing dashboard content (search, stats, upcoming/recent meets) preserved below

### 4. Navigation Updates

**File: `src/components/Navbar.tsx` — Updated**

- Team branding shown on team pages (logo, name, school — from team record)
- All auth links team-scoped: "Sign In" → `/t/:slug/login`
- Sign Out redirects to team-scoped login page
- Removed "⭐ Favorites" nav link (favorites are now on dashboard)
- Added **"← TrackBoard"** link in both desktop and mobile nav to return to landing/directory
- "Home" nav link renamed to "Dashboard"

**File: `src/components/Layout.tsx` — Updated**
- Footer: "{team.name} — {school_name} · Powered by TrackBoard" instead of "Cardinal Track"

### 5. Route Structure Summary

```
/                              → Landing (TrackBoard platform, team directory)
/login                         → Redirect to / with message
/register                      → Redirect to / with message
/parent-signup                 → Redirect to / with message
/onboard                       → Team onboarding (global)
/join                          → Join team (global)
/t/:slug/login                 → Team-scoped login (full page, TeamProvider, no Layout)
/t/:slug/register              → Team-scoped coach registration (full page)
/t/:slug/parent-signup         → Team-scoped parent signup (full page)
/t/:slug                       → Team dashboard (with favorites for parents)
/t/:slug/roster                → Roster
/t/:slug/meets                 → Meets
/t/:slug/meets/:id             → Meet detail
/t/:slug/meets/:id/report      → Meet report
/t/:slug/events                → Events
/t/:slug/athletes/:id          → Athlete detail
/t/:slug/search                → Public search
/t/:slug/settings              → Settings
/t/:slug/favorites             → My Favorites (secondary, still accessible)
```

### What Was NOT Changed
- Database/migrations — zero changes
- AuthContext.tsx — unchanged (isCoachForTeam already exists)
- useFavorites.ts — unchanged (just integrated into Dashboard)
- MyFavorites.tsx — preserved as secondary page
- All other pages (Roster, Meets, MeetDetail, etc.) — unchanged
- All backward-compatible redirects from old URLs — preserved
- Bishop Snyder `is_grandfathered: true` — untouched



---

## Cross-Team Guest Mode + Season Management (2025-07-14)

### Feature 1: Cross-Team Viewing Warning (Guest Mode)

When a logged-in user navigates to a team that is NOT their `profile.team_id`, a modal appears asking them to either "View as Guest" (read-only) or "Go Back" to the landing page.

**New files:**
| File | Purpose |
|------|---------|
| `src/components/TeamGuard.tsx` | Modal component that detects cross-team viewing. Fetches user's team name, shows warning, sets `guestMode` flag on TeamContext. |
| `src/components/GuestBanner.tsx` | Subtle amber banner at top of page: "👀 Viewing [Team Name] as guest" |

**Modified files:**
| File | Changes |
|------|---------|
| `src/contexts/TeamContext.tsx` | Added `guestMode` and `setGuestMode` state. Resets on team change. |
| `src/hooks/useTeam.ts` | Exposes `guestMode` and `setGuestMode` from context. |
| `src/components/Layout.tsx` | Renders `<TeamGuard />` and `<GuestBanner />`. |
| `src/components/Navbar.tsx` | Uses `effectiveIsCoach` (isCoach && !guestMode). Shows "Guest" badge. Hides Settings link in guest mode. |
| `src/pages/Dashboard.tsx` | Hides coach buttons and favorites section in guest mode. |
| `src/pages/Meets.tsx` | Hides "New Meet" button and delete buttons in guest mode. |
| `src/pages/Roster.tsx` | Hides "Add Athlete", "Import Athletes" buttons and inline edit in guest mode. |
| `src/pages/MeetDetail.tsx` | Hides "Copy from Meet", TFRRS editing, coach settings bar, and passes `effectiveIsCoach` to EventCard/GridView. |
| `src/pages/AthleteDetail.tsx` | Hides favorite button and TFRRS editing in guest mode. |
| `src/pages/PublicSearch.tsx` | Hides favorite buttons in guest mode. |
| `src/pages/Settings.tsx` | Shows parent/viewer view in guest mode (not coach tools). |

**Guest mode behavior:**
- Does NOT sign the user out of Supabase
- Hides all coach edit/add/delete buttons
- Hides favorites functionality (star buttons)
- Shows subtle amber "Viewing as guest" banner
- User stays logged in but sees the other team in read-only
- Navigating to their own team works normally (no warning)

### Feature 2: Season Management

**New migration: `supabase/migrations/00012_seasons.sql`**
- Creates `seasons` table (id, team_id, name, start_date, end_date, is_active, created_at)
- Unique partial index ensures only one active season per team
- RLS: public read, coaches can insert/update/delete for their team
- Adds `season_id` column to `meets` table (nullable, FK to seasons)
- Seeds "Spring 2026" season for Bishop Snyder, backfills all existing meets

**New files:**
| File | Purpose |
|------|---------|
| `src/hooks/useSeasons.ts` | CRUD hook: fetch seasons by team, add/update/delete season, setActiveSeason (deactivates all others first). |
| `src/components/SeasonSelector.tsx` | Small dropdown showing all seasons for the team. "All Seasons" option + per-season options. Active season marked with ✦. |
| `src/components/SeasonModal.tsx` | Modal for coaches to create/edit a season (name, start date, end date). |
| `src/components/AthleteSeasonStats.tsx` | Displays meet count and event count for an athlete in the selected season. Queries meets by season_id, then counts meet_entries. |

**Modified files:**
| File | Changes |
|------|---------|
| `src/types/database.ts` | Added `Season`, `SeasonInsert`, `SeasonUpdate` types. Added `season_id` to `Meet` type. |
| `src/contexts/TeamContext.tsx` | Fetches seasons on team load. Manages `selectedSeasonId` state (defaults to active season). Provides seasons list and activeSeason. |
| `src/hooks/useTeam.ts` | Exposes `selectedSeasonId`, `setSelectedSeasonId`, `seasons`, `seasonsLoading`, `activeSeason`. |
| `src/hooks/useMeets.ts` | Accepts optional `seasonFilter` parameter. When provided, filters meets by `season_id`. |
| `src/pages/Dashboard.tsx` | SeasonSelector in hero section. Meets filtered by selected season. Stats reflect season-filtered data. |
| `src/pages/Meets.tsx` | SeasonSelector next to "New Meet" button. Meets filtered by season. New meets auto-assigned to active season. Shows season name hint in create form. |
| `src/pages/Roster.tsx` | SeasonSelector in header. Shows `AthleteSeasonStats` per athlete when a season is selected. |
| `src/pages/AthleteDetail.tsx` | SeasonSelector next to back button. Entries filtered by selected season. Shows `AthleteSeasonStats` in header. Stats (meets count, entries count) reflect filtered data. |
| `src/pages/Settings.tsx` | New "Season Management" section: lists all seasons, create/edit/delete, "Set Active" button. Uses SeasonModal. |
| `src/components/Navbar.tsx` | Shows active season name next to school name in logo area. |

**Season UX flow:**
1. Coach visits dashboard → sees active season's data by default
2. SeasonSelector dropdown on Dashboard, Meets, Roster, AthleteDetail lets them switch seasons
3. "All Seasons" option shows everything (no filter)
4. Settings → Season Management → "New Season" → name + start date → create
5. "Set Active" deactivates old season, activates new one
6. New meets auto-link to active season
7. AthleteSeasonStats shows per-athlete event/meet counts scoped to selected season

### Migration Instructions

**Jacob needs to run migration 00012 in Supabase SQL Editor:**
- File: `supabase/migrations/00012_seasons.sql`
- Creates `seasons` table with RLS
- Adds `season_id` column to `meets`
- Seeds "Spring 2026" for Bishop Snyder and backfills existing meets

### Build Status
- ✅ `npm run build` passes with zero errors
- ✅ NOT deployed to Vercel
- ✅ All existing features preserved
- ✅ Bishop Snyder remains FREE FOREVER

---

## Phase 1: Foundation (Database + Team Scoping)

### New Migrations
| File | Purpose |
|------|---------|
| `supabase/migrations/00006_add_teams.sql` | Creates `teams` table with full schema (id, name, slug, school_name, logo_url, primary/secondary colors, stripe_subscription_id, is_grandfathered, active, created_at). RLS enabled with public read + team-scoped update. |
| `supabase/migrations/00007_add_team_id.sql` | Adds nullable `team_id` FK to `athletes`, `meets`, and `profiles`. Creates indexes for performance. |
| `supabase/migrations/00008_seed_bishop_snyder.sql` | Inserts Bishop Snyder as founding team (slug: `bishop-snyder`, is_grandfathered: `true`). Backfills ALL existing athletes, meets, and profiles with Bishop Snyder's team_id. Then sets `team_id` NOT NULL on athletes and meets (profiles stays nullable for global admins). |
| `supabase/migrations/00009_update_rls.sql` | Drops old write policies for athletes/meets/meet_entries. Creates new team-scoped write policies where coaches can only write to their own team's data. Meet entries are scoped through the meet's team_id. Public SELECT policies are UNTOUCHED. Events policies unchanged (events are universal). |

### New Files
| File | Purpose |
|------|---------|
| `src/types/database.ts` | Added `Team` interface + `TeamInsert`/`TeamUpdate` types. Added `team_id` to `Athlete`, `Meet`, and `Profile` interfaces. |
| `src/contexts/TeamContext.tsx` | New context that resolves team from URL slug (`:slug` param), fetches from Supabase, provides `team`, `teamId`, `teamSlug`, `loading`, `error`. |
| `src/hooks/useTeam.ts` | Convenience hook wrapping `useTeamContext()`. Also exports `useTeamPath()` for building team-scoped URL paths. |

### Modified Hooks
| File | Changes |
|------|---------|
| `src/hooks/useAthletes.ts` | All queries now filter by `team_id` from `useTeam()`. `addAthlete()` and `bulkAddAthletes()` auto-inject `team_id`. Signature changed to `Omit<AthleteInsert, 'team_id'>` so callers don't need to pass it. |
| `src/hooks/useMeets.ts` | All queries filter by `team_id`. `addMeet()` auto-injects `team_id`. |
| `src/hooks/useMeetEntries.ts` | **Unchanged** — already scoped through `meet_id`, which has a `team_id`. |
| `src/hooks/useEvents.ts` | **Unchanged** — events are global (no `team_id`). |

### Modified Auth
| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | Added `isCoachForTeam(teamId)` method. Global admin emails preserved (`tarantellijacob@gmail.com`, `ttarantelli@gmail.com`). Admins pass all team checks. |

---

## Phase 2: URL Routing

### Route Structure
```
/                           → Landing page (new)
/login                      → Login (global, not team-scoped)
/register                   → Register (global, not team-scoped)
/t/:slug                    → Team dashboard (was /)
/t/:slug/roster             → Roster (was /roster)
/t/:slug/meets              → Meets list (was /meets)
/t/:slug/meets/:id          → Meet detail (was /meets/:id)
/t/:slug/meets/:id/report   → Meet report (was /meets/:id/report)
/t/:slug/events             → Events (was /events)
/t/:slug/athletes/:id       → Athlete detail (was /athletes/:id)
/t/:slug/search             → Public search (was /search)
/t/:slug/settings           → Settings (was /settings)
```

### Backward-Compatible Redirects
All old paths permanently redirect to `/t/bishop-snyder/*`:
- `/roster` → `/t/bishop-snyder/roster`
- `/meets` → `/t/bishop-snyder/meets`
- `/meets/:id` → `/t/bishop-snyder/meets/:id`
- `/meets/:id/report` → `/t/bishop-snyder/meets/:id/report`
- `/events` → `/t/bishop-snyder/events`
- `/athletes/:id` → `/t/bishop-snyder/athletes/:id`
- `/search` → `/t/bishop-snyder/search`
- `/settings` → `/t/bishop-snyder/settings`

### New Files
| File | Purpose |
|------|---------|
| `src/pages/Landing.tsx` | Public marketing/landing page at `/`. Features hero, feature cards, links to Bishop Snyder dashboard and search. |

### Modified Files
| File | Changes |
|------|---------|
| `src/App.tsx` | Complete rewrite. Landing at `/`, auth routes global, team routes under `/t/:slug/*` wrapped in `TeamProvider`. Redirect helpers for parameterized routes. |
| `src/components/Layout.tsx` | Now reads team from `useTeam()`. Shows loading/error states. Dynamic school name in footer. |
| `src/components/Navbar.tsx` | All nav links use `useTeamPath()`. Dynamic team name, logo, and school name from team record. |
| `src/components/MeetCard.tsx` | Link uses `useTeamPath()`. |
| `src/components/AthleteCard.tsx` | Link uses `useTeamPath()`. |
| `src/components/PrintMeetSheet.tsx` | Uses team school_name for print footer. |
| `src/pages/Dashboard.tsx` | All links use `useTeamPath()`. Dynamic team name/school in hero. |
| `src/pages/Roster.tsx` | All links use `useTeamPath()`. |
| `src/pages/Meets.tsx` | Uses team-scoped hooks (no direct link changes needed — MeetCard handles it). |
| `src/pages/MeetDetail.tsx` | All links use `useTeamPath()`. |
| `src/pages/MeetReport.tsx` | All links use `useTeamPath()`. Dynamic school name in print footer. |
| `src/pages/AthleteDetail.tsx` | All links use `useTeamPath()`. Meets scoped to team. |
| `src/pages/PublicSearch.tsx` | Athletes and meets scoped to team via `team_id` filter. |
| `src/pages/Login.tsx` | Redirects to `/t/bishop-snyder` after login. Links updated. |
| `src/pages/Register.tsx` | Redirects to `/t/bishop-snyder` after registration. |
| `src/lib/hytek-export.ts` | Added `teamToHyTekConfig(team)` function to convert Team record to HyTek config. Default team kept as fallback. |

---

## Phase 4: CSV Upload Enhancement

### Modified Files
| File | Changes |
|------|---------|
| `src/components/BulkImportModal.tsx` | Added file upload button (`<input type="file" accept=".csv,.txt,.tsv">`). Uses `FileReader` to read CSV content into the existing textarea/parser. "Upload CSV" and "Paste data" are two input methods with an OR divider. Existing paste functionality fully preserved. Mobile card layout for preview table. |

---

## Phase 6: Mobile Polish

### Changes Applied Across All Components

**Touch Targets (≥44px):**
- All interactive buttons now have `min-h-[44px]` and/or `min-w-[44px]`
- Filter pills enlarged with `py-2` padding
- Settings gear button enlarged
- Modal close buttons enlarged
- Back navigation links enlarged
- Mobile nav items have `py-3` for proper touch area
- Checkbox inputs have `w-5 h-5` for easier touch

**Grid View Mobile Fix (MeetDetail.tsx):**
- Event selector tabs now use horizontal scroll container (`overflow-x-auto`) with `-mx-4 px-4` to extend to viewport edges
- `min-w-max` prevents event buttons from wrapping/squishing
- `whitespace-nowrap` keeps event labels on one line

**Meet Report Mobile Fix (MeetReport.tsx):**
- Already uses card layout for screen view (not table)
- Event badges have `py-1.5` for better touch targets
- Filter buttons enlarged

**BulkImportModal Mobile Fix:**
- Preview table on desktop, card layout on mobile using `hidden sm:block` / `sm:hidden`
- Each preview row is a small card showing name, grade, level, gender
- Error rows highlighted with red border

**EventCard Mobile Fix:**
- Remove button always visible on mobile (only hidden on desktop hover)
- `sm:opacity-0 sm:group-hover:opacity-100` pattern

**SearchBar:**
- Clear button has `min-w-[44px]` touch target

---

## What Was NOT Changed

- `.env` / `.env.example` — no credentials touched
- `supabase/seed.sql` — existing seed data untouched
- `src/hooks/useEvents.ts` — events are global, no team scoping
- `src/hooks/useMeetEntries.ts` — already scoped through meet_id
- `src/pages/Events.tsx` — events are universal, no team_id
- `src/pages/Settings.tsx` — no changes (future: scope to team)
- `src/components/AthleteAssignModal.tsx` — no changes needed (touch targets already good)
- `src/components/ProtectedRoute.tsx` — no changes needed
- `tailwind.config.js` — no changes needed
- `vite.config.ts` — no changes needed
- `vercel.json` — not deployed, no changes
- `index.html` — no changes needed

---

---

## Phase 7: Team Onboarding + Stripe

### New Files
| File | Purpose |
|------|---------|
| `src/pages/TeamOnboarding.tsx` | Multi-step wizard: Step 1 (Coach account — new or sign in), Step 2 (Team info — name, school, slug, colors, logo), Step 3 (Plan selection — $300/season), Step 4 (Create team + redirect). Creates team in Supabase with `is_grandfathered: false`, sets coach's `profile.team_id`. |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/Landing.tsx` | "Start Your Team" button → `/onboard`. "See in Action" → `/t/bishop-snyder`. "Join as Parent" link → `/parent-signup`. Nav updated. |
| `src/App.tsx` | Added `/onboard` route for `TeamOnboarding`. |

### Stripe Integration Status
- **UI complete**: Full plan selection and checkout flow built.
- **TODO**: Replace `STRIPE_PAYMENT_LINK` placeholder in `TeamOnboarding.tsx` with Jacob's real Stripe Payment Link.
- **Current behavior**: Teams are created directly (payment skipped with note). When Stripe is ready, create team on successful webhook, redirect to Stripe first.

---

## Phase 5: Parent/Athlete Open Signup + Favorites

### New Migrations
| File | Purpose |
|------|---------|
| `supabase/migrations/00010_favorites.sql` | Creates `favorites` table (id, profile_id FK, athlete_id FK, created_at, UNIQUE constraint). RLS: users can read/write their own favorites only. |

### New Files
| File | Purpose |
|------|---------|
| `src/pages/ParentSignup.tsx` | Simple signup: name, email, password, pick team from dropdown. Role = 'parent', auto-approved. Redirects to team dashboard after signup. |
| `src/pages/JoinTeam.tsx` | For existing users to join/switch teams. Shows list of active teams with join buttons. Current team highlighted. |
| `src/pages/MyFavorites.tsx` | Personal dashboard showing favorited athletes with upcoming meets and event assignments. Empty state links to search. |
| `src/hooks/useFavorites.ts` | CRUD hook for favorites: `addFavorite`, `removeFavorite`, `toggleFavorite`, `isFavorite`. Scoped to current user via `auth.uid()`. |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/AthleteDetail.tsx` | Added ⭐ favorite toggle button (logged-in users only). Shows filled/empty star. |
| `src/pages/PublicSearch.tsx` | Added ⭐ favorite button in search results for logged-in users. |
| `src/pages/Login.tsx` | Changed "Register" link to "Register as Coach". Added "Sign up as Parent/Athlete" button → `/parent-signup`. |
| `src/pages/Landing.tsx` | Added "Join as Parent" link in hero section. |
| `src/components/Navbar.tsx` | Added "⭐ Favorites" nav link for logged-in non-coach users. |
| `src/contexts/AuthContext.tsx` | Updated `signUp()` to support parent/athlete role (auto-approved) vs coach role (pending approval). |
| `src/App.tsx` | Added routes: `/parent-signup`, `/join`, `/t/:slug/favorites`. |
| `src/types/database.ts` | Added `Favorite`, `FavoriteInsert`, `FavoriteUpdate` types. |

---

## Phase 8: TFRRS Auto-Linking

### New Migrations
| File | Purpose |
|------|---------|
| `supabase/migrations/00011_tfrrs.sql` | Adds `tfrrs_url` column to athletes. Creates `tfrrs_meet_links` table (id, meet_id FK, tfrrs_url, created_at). RLS: public read, coaches write. |

### New Files
| File | Purpose |
|------|---------|
| `src/lib/tfrrs.ts` | Helper functions: `searchTFRRS(school, name)` builds TFRRS search URL for athlete profiles. `searchTFRRSMeet(meetName, date)` builds TFRRS search URL for meet results. `isValidTFRRSUrl()` validates TFRRS URLs. `tfrrsDisplayLabel()` extracts display label. |
| `src/components/TFRRSLink.tsx` | Badge/button component that links to TFRRS. Two variants: `badge` (inline, small) and `button` (larger, blue). |

### Modified Files
| File | Changes |
|------|---------|
| `src/pages/AthleteDetail.tsx` | Shows TFRRS link badge if athlete has `tfrrs_url`. Coach-only section: "Search TFRRS" link + "Link to TFRRS" button with URL input. Edit existing link. |
| `src/pages/MeetDetail.tsx` | Added TFRRS section in meet header: shows linked TFRRS results, coach can add/remove TFRRS result URLs, "Search TFRRS" link auto-generates search query from meet name+year. |
| `src/pages/MeetReport.tsx` | Shows TFRRS badge next to athlete names who have `tfrrs_url` set. |
| `src/types/database.ts` | Added `tfrrs_url` to `Athlete` interface. Added `TFRRSMeetLink`, `TFRRSMeetLinkInsert`, `TFRRSMeetLinkUpdate` types. Made `tfrrs_url` optional in `AthleteInsert`. |

---

## Migration Instructions

**Jacob needs to run two new migrations in Supabase SQL Editor.**  
See `MIGRATIONS-PHASE2.md` for copy-paste-ready SQL.

1. **00010_favorites.sql** — Favorites table + RLS
2. **00011_tfrrs.sql** — TFRRS columns + table + RLS

---

## Bishop Snyder Preservation Checklist

- ✅ Bishop Snyder team seeded with `is_grandfathered: true`
- ✅ ALL existing data backfilled with Bishop Snyder team_id
- ✅ Old URLs redirect permanently to `/t/bishop-snyder/*`
- ✅ Public read access preserved (no auth required for viewing)
- ✅ Admin emails preserved as GLOBAL admins
- ✅ Events table has NO team_id (universal)
- ✅ Meet entries scoped through meet's team_id
- ✅ Hy-Tek export still works with default BISH team code
- ✅ All coach write operations inject team_id automatically
- ✅ Bishop Snyder branding (colors, logo) served from team record
