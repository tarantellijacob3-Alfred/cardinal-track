# AUDIT-V2.md — Cardinal Track Multi-Team v2 Blueprint

**Audit Date:** 2025-07-10  
**Auditor:** Alfred (AI)  
**Current State:** Bishop Snyder is LIVE with active users. All v2 changes must be additive.  
**Repo:** `github.com/tarantellijacob3-Alfred/cardinal-track`  
**Hosting:** Vercel (project: `bishop-snyder-track`)

---

## 1. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | React 18.3 + Vite 6 | SPA, client-side routing |
| **Language** | TypeScript 5.6 (strict) | Path alias `@/` → `src/` |
| **Routing** | react-router-dom 6.28 | `BrowserRouter`, flat route list |
| **Database** | Supabase (PostgreSQL) | RLS enabled on all tables |
| **Auth** | Supabase Auth | Email/password, auto profile creation via DB trigger |
| **CSS** | Tailwind CSS 3.4 | Custom `cardinal`, `navy`, `gold` color palette |
| **Fonts** | Playfair Display (headings) | Loaded via Google Fonts CDN |
| **Build** | `tsc -b && vite build` | Standard Vite SPA output |
| **Hosting** | Vercel | SPA rewrites (`/(.*) → /index.html`) |
| **State** | React hooks (useState/useEffect) | No Redux/Zustand — all local state + Supabase queries |
| **Package Manager** | npm (lockfile present) | |

**Key observations:**
- Zero server-side rendering — pure SPA
- No API routes — all data flows through Supabase JS client directly
- No environment variable server-side secrets — only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Vercel config is minimal (just SPA rewrite)

---

## 2. File Structure

### Root Config Files
| File | Description |
|------|-------------|
| `package.json` | Dependencies & scripts; name `cardinal-track` |
| `vite.config.ts` | Vite + React plugin, `@/` path alias |
| `tailwind.config.js` | Custom cardinal/navy/gold color palette (Bishop Snyder branding) |
| `postcss.config.js` | Standard Tailwind PostCSS setup |
| `tsconfig.json` | References app + node configs |
| `tsconfig.app.json` | Strict TS, `@/*` path mapping |
| `tsconfig.node.json` | For Vite config file only |
| `vercel.json` | SPA catch-all rewrite |
| `.env.example` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `index.html` | Entry HTML, viewport meta, title "Cardinal Track" |

### `/public/`
| File | Description |
|------|-------------|
| `cardinal-logo.jpg` | Bishop Snyder Cardinals logo (57KB) |
| `favicon.svg` | SVG favicon |

### `/supabase/migrations/`
| File | Description |
|------|-------------|
| `00001_create_tables.sql` | Core schema: `athletes`, `events`, `meets`, `meet_entries`, `profiles` + auto-profile trigger |
| `00002_rls_policies.sql` | RLS: public read all, coaches write (insert/update/delete), profiles self-update |
| `00003_fix_max_entries.sql` | Fix: set `max_entries` to 99 (individual) / 8 (relay) |
| `00004_coach_update_profiles.sql` | Allow approved coaches to update any profile |
| `00005_approve_gregory_coach.sql` | One-off: approve specific user as coach |

### `/supabase/`
| File | Description |
|------|-------------|
| `seed.sql` | 23 events, 81 athletes (boys JV), 1 sample meet with entries |

### `/src/`

#### Entry Point
| File | Description |
|------|-------------|
| `main.tsx` | React root render with StrictMode |
| `App.tsx` | `BrowserRouter` + `AuthProvider` + all `<Route>` definitions |
| `index.css` | Tailwind imports, custom component classes (`btn-primary`, `card`, `badge-*`), print styles |
| `vite-env.d.ts` | Vite type reference |

#### `/src/lib/`
| File | Description |
|------|-------------|
| `supabase.ts` | Supabase client init from env vars (with placeholder fallbacks) |
| `hytek-export.ts` | Hy-Tek semi-colon delimited entry file generator for meet export |

#### `/src/types/`
| File | Description |
|------|-------------|
| `database.ts` | All TypeScript interfaces: `Athlete`, `TrackEvent`, `Meet`, `MeetEntry`, `Profile`, plus Insert/Update types and joined types |

#### `/src/contexts/`
| File | Description |
|------|-------------|
| `AuthContext.tsx` | Auth state provider: user, session, profile, `isCoach`, `isAdmin`, sign in/up/out, hardcoded admin emails |

#### `/src/hooks/`
| File | Description |
|------|-------------|
| `useAthletes.ts` | CRUD for athletes + `bulkAddAthletes` + single `useAthlete(id)` |
| `useEvents.ts` | Fetch events sorted by category, `getEventsByCategory()` helper |
| `useMeetEntries.ts` | CRUD for meet entries with joined athlete/event data, `useAthleteEntries(id)` |
| `useMeets.ts` | CRUD for meets + single `useMeet(id)` |

#### `/src/components/`
| File | Description |
|------|-------------|
| `Layout.tsx` | App shell: `Navbar` + `<Outlet>` + footer with Bishop Snyder branding |
| `Navbar.tsx` | Top nav: logo, links, mobile hamburger menu, auth status/sign-out |
| `ProtectedRoute.tsx` | Auth gate: redirects to `/login` or shows "Access Denied" for non-coaches |
| `SearchBar.tsx` | Reusable search input with clear button |
| `AthleteCard.tsx` | Athlete display row with avatar initials, event count badge |
| `AthleteAssignModal.tsx` | Full-screen modal: search + select athletes to assign to an event, batch mode, 4-event limit |
| `BulkImportModal.tsx` | Paste CSV/tab/space-separated athletes, auto-detect format, preview table |
| `EventCard.tsx` | Event display card with assigned athletes, category color coding, coach add/remove |
| `MeetCard.tsx` | Meet summary card with date, location, level badge, upcoming/completed status |
| `PrintMeetSheet.tsx` | Print-optimized meet sheet (hidden on screen, shown on print) |

#### `/src/pages/`
| File | Description |
|------|-------------|
| `Dashboard.tsx` | Home: hero banner, quick search, stats grid, upcoming + recent meets |
| `Login.tsx` | Email/password sign-in form, link to register, "continue as parent" |
| `Register.tsx` | Coach account signup (all signups → coach pending approval) |
| `Roster.tsx` | Full athlete list: search, filter by level/gender, inline edit, add/import/settings modal |
| `Meets.tsx` | Meet list with create form, delete button |
| `MeetDetail.tsx` | Single meet: card view + grid view, assign athletes to events, copy from previous meet, print, stats, Hy-Tek export support |
| `MeetReport.tsx` | Per-athlete view of meet: who's in what events, 4-event limit warnings, print-optimized |
| `Events.tsx` | Event CRUD: list by category, add/edit/delete modal |
| `AthleteDetail.tsx` | Single athlete profile: stats, meet history with event badges |
| `PublicSearch.tsx` | Unauthenticated athlete search: find any athlete + see their meet assignments |
| `Settings.tsx` | Admin panel: pending coach requests, coach list (promote/demote/delete), parent list |

---

## 3. Database Schema

### Table: `athletes`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | uuid | PK, auto-gen | |
| `first_name` | text | NOT NULL | |
| `last_name` | text | NOT NULL | |
| `grade` | int | nullable | 9-12 |
| `level` | text | CHECK ('JV', 'Varsity') | default 'JV' |
| `gender` | text | CHECK ('Boys', 'Girls') | default 'Boys' |
| `active` | boolean | | default true |
| `created_at` | timestamptz | | default now() |

**Indexes:** `last_name`, `active`  
**⚠️ No `team_id` column** — currently single-team only.

### Table: `events`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | uuid | PK, auto-gen | |
| `name` | text | NOT NULL | e.g. "100m" |
| `short_name` | text | NOT NULL | e.g. "100m" |
| `category` | text | CHECK (Field/Sprint/Distance/Hurdles/Relay/Other) | |
| `max_entries` | int | | 99 for individual, 8 for relay |
| `is_relay` | boolean | | default false |

**⚠️ No `team_id` column** — events are global. This is correct for track (events are universal), but if teams want custom event lists, needs thought.

### Table: `meets`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | uuid | PK, auto-gen | |
| `name` | text | NOT NULL | |
| `date` | date | NOT NULL | |
| `location` | text | nullable | |
| `level` | text | CHECK ('JV', 'Varsity', 'Both') | default 'JV' |
| `notes` | text | nullable | |
| `created_at` | timestamptz | | default now() |

**⚠️ No `team_id` column** — meets are unscoped.

### Table: `meet_entries`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | uuid | PK, auto-gen | |
| `meet_id` | uuid | FK → meets(id) CASCADE | |
| `athlete_id` | uuid | FK → athletes(id) CASCADE | |
| `event_id` | uuid | FK → events(id) CASCADE | |
| `relay_leg` | int | nullable | 1-4 for relays |
| `relay_team` | text | CHECK ('A', 'Alt') | nullable |
| `created_at` | timestamptz | | default now() |

**Unique:** `(meet_id, athlete_id, event_id)`  
**Indexes:** `meet_id`, `athlete_id`, `event_id`

### Table: `profiles`
| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| `id` | uuid | PK, FK → auth.users(id) CASCADE | |
| `email` | text | nullable | |
| `full_name` | text | nullable | |
| `role` | text | CHECK ('coach', 'parent', 'athlete') | default 'athlete' |
| `approved` | boolean | | default false |
| `created_at` | timestamptz | | default now() |

**⚠️ No `team_id` column** — profiles are unscoped.  
**⚠️ DB CHECK constraint only allows 'coach', 'parent', 'athlete' — but TypeScript type also includes 'admin'**. Admin is determined by hardcoded email list in `AuthContext.tsx`, not a DB role.

### Auto-Profile Trigger
On `auth.users` INSERT → creates `profiles` row with `role='athlete'`, `approved=false`.

### RLS Policies
- **All tables:** Public SELECT (read) for everyone (even unauthenticated)
- **Write (INSERT/UPDATE/DELETE):** Only `profiles.role = 'coach' AND profiles.approved = true`
- **Profiles UPDATE:** Users can update own row + approved coaches can update any profile

### Relationships
```
profiles ──── auth.users (1:1)
athletes ◄──── meet_entries (1:many)
events   ◄──── meet_entries (1:many)
meets    ◄──── meet_entries (1:many)
```

No foreign keys between athletes↔profiles (athletes are managed by coaches, not self-registered).

---

## 4. Current Routes / Pages

| Route | Page Component | Auth Required | Coach Required | Description |
|-------|---------------|--------------|----------------|-------------|
| `/` | `Dashboard` | No | No | Home: hero, stats, quick search, upcoming/recent meets |
| `/login` | `Login` | No | No | Email/password sign-in |
| `/register` | `Register` | No | No | Coach account registration (pending approval) |
| `/roster` | `Roster` | No | No (read), Yes (write) | Full athlete list with CRUD |
| `/meets` | `Meets` | No | No (read), Yes (write) | Meet list with create/delete |
| `/meets/:id` | `MeetDetail` | No | No (read), Yes (write) | Meet detail: assign athletes to events |
| `/meets/:id/report` | `MeetReport` | No | No | Per-athlete meet roster view |
| `/events` | `Events` | No | No (read), Yes (write) | Event CRUD by category |
| `/athletes/:id` | `AthleteDetail` | No | No | Single athlete profile + meet history |
| `/search` | `PublicSearch` | No | No | Public athlete lookup |
| `/settings` | `Settings` | No | Partial | Admin: user management; Non-coach: own profile |

**Key observations:**
- Every page is publicly readable (by design — parents can browse without accounts)
- Write operations are gated by `isCoach` checks in components (not route-level)
- `ProtectedRoute` component exists but is **not used in any route** — all protection is inline
- No 404 route defined

---

## 5. Current Features

### Roster Management
- View all active athletes, filter by level (JV/Varsity) and gender (Boys/Girls)
- Search by name (first, last, or combined)
- **Add athlete** (coach only): form with first/last name, grade, level, gender
- **Bulk import** (coach only): paste CSV/tab/space-separated data, auto-detect format, preview before import
- **Inline edit** (coach only): click name/grade to edit in-place
- **Settings modal** (coach only): promote/demote level, deactivate, permanently delete
- Athlete counts: total active, by level

### Meet Management
- List all meets sorted by date (newest first)
- **Create meet** (coach only): name, date, location, level, notes
- **Delete meet** (coach only): with confirmation
- Meet cards show date, location, level badge, upcoming/completed status

### Meet Detail / Event Assignment
- **Card view**: events displayed as cards by category, with assigned athletes listed
- **Grid view**: event tabs across top, two-column layout (assigned + available athletes)
- **Assign athletes** (coach only): modal with search, batch select, 4-event limit enforcement
- **Copy from previous meet** (coach only): duplicate all entries from another meet
- **Relay support**: leg assignment (1-4), team designation (A/Alt)
- **Stats**: entry count, unique athletes, events filled
- **Category filters**: Field, Sprint, Distance, Hurdles, Relay, Other
- **Gender filter**: auto-detect from meet name ("Boys" / "Girls") or manual toggle
- **Print**: browser print with `PrintMeetSheet` component (print-optimized layout)

### Meet Report
- Per-athlete view: each athlete → their event list
- 4-event limit warnings (highlighted in red)
- Filter by gender and level
- Print-optimized table layout

### Hy-Tek Export
- `hytek-export.ts` generates industry-standard semi-colon delimited entry files
- Supports individual (D record) and relay (Q record) entries
- Hardcoded team: `BISH` / `Bishop Snyder`
- **Note:** Export UI trigger not visible in current pages — lib exists but may need UI button

### Events Management
- List all events grouped by category with color coding
- **Add/Edit/Delete events** (coach only): name, short name, category, max entries, relay flag

### Athlete Detail
- Profile card with avatar, level, gender, grade
- Stats: total meets, total entries
- Meet history with event badges per meet

### Public Search
- Unauthenticated search: find athlete by name
- View athlete's meet assignments
- Full data loaded client-side (no server-side search)

### Auth & User Management
- **Sign in**: email/password via Supabase Auth
- **Register**: creates coach account (pending approval)
- **Admin panel** (Settings page): 
  - View pending coach requests → approve/disapprove
  - View approved coaches → demote/delete
  - View parents → promote to coach/delete
- **Admin detection**: hardcoded email list (`tarantellijacob@gmail.com`, `ttarantelli@gmail.com`)

---

## 6. Mobile Responsiveness

### Current State: **Partially Responsive**

**What's responsive:**
- ✅ Tailwind responsive prefixes used throughout (`sm:`, `md:`, `lg:`)
- ✅ Mobile hamburger menu in `Navbar.tsx` (toggles at `md:` breakpoint)
- ✅ Layout uses `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` — proper container
- ✅ Card grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- ✅ Modals: `items-end sm:items-center` (bottom-sheet on mobile, centered on desktop)
- ✅ Filter pills wrap on mobile with `flex-wrap`
- ✅ Viewport meta tag present in `index.html`

**What's NOT mobile-first:**
- ⚠️ Grid view in MeetDetail has horizontal scroll issues on small screens
- ⚠️ Tables in MeetReport and BulkImportModal aren't fully responsive
- ⚠️ Inline edit cells in Roster page can be finicky on touch
- ⚠️ No touch-optimized interactions (swipe, long-press)
- ⚠️ Event button row in grid view can overflow

**CSS Framework:** Tailwind CSS 3.4 — already excellent for responsive design.  
**No additional component library** (no Headless UI, Radix, etc.)

---

## 7. Auth

### Authentication
- **Method:** Supabase Auth with email/password
- **Sign up flow:** Register → auto-create profile via DB trigger → coach approval required
- **All signups become coach accounts** (pending approval) — there's no separate parent/athlete signup flow

### Authorization (Roles)
| Role | How Determined | Capabilities |
|------|---------------|-------------|
| **Admin** | Hardcoded email list in `AuthContext.tsx` | All coach powers + manage users (approve/demote/delete) |
| **Coach** | `profiles.role = 'coach' AND approved = true` | CRUD athletes, meets, events, entries |
| **Parent/Athlete** | Default after registration (if not approved) | Read-only access to all public data |
| **Anonymous** | No account | Same as Parent — read-only (RLS allows public SELECT) |

### Key Auth Details
- `isAdmin` = `profile.role === 'admin'` OR email in hardcoded list
- `isCoach` = `isAdmin` OR (`role === 'coach'` AND `approved === true`)
- Admin emails: `tarantellijacob@gmail.com`, `ttarantelli@gmail.com`
- No password reset flow in UI (Supabase provides it but no UI wired up)
- No OAuth/social login
- **No team scoping** — a coach can edit ANY athlete/meet (no multi-team isolation)

---

## 8. Files That Need Changes Per v2 Feature

### 8a. Multi-Team Support (teams table, team_id scoping)

**New files needed:**
| File | Purpose |
|------|---------|
| `supabase/migrations/00006_add_teams.sql` | `teams` table (id, name, slug, logo_url, primary_color, secondary_color, created_at, stripe_subscription_id, active) |
| `supabase/migrations/00007_add_team_id_columns.sql` | Add `team_id` FK to: `athletes`, `meets`, `profiles` (NOT events — those are universal) |
| `supabase/migrations/00008_update_rls_team_scoping.sql` | RLS policies scoped by team_id (coach can only write to own team) |
| `supabase/migrations/00009_seed_bishop_snyder_team.sql` | Create Bishop Snyder team, backfill all existing data with its team_id |
| `src/types/database.ts` | Add `Team` interface, add `team_id` to Athlete, Meet, Profile |
| `src/contexts/TeamContext.tsx` | New context: current team from URL slug, team data |
| `src/hooks/useTeam.ts` | Hook to fetch/manage team data |

**Files to modify:**
| File | Changes |
|------|---------|
| `src/hooks/useAthletes.ts` | All queries add `.eq('team_id', teamId)` filter |
| `src/hooks/useMeets.ts` | All queries add `.eq('team_id', teamId)` filter |
| `src/hooks/useMeetEntries.ts` | Entries already scoped by meet_id (which has team_id), but joins may need updating |
| `src/contexts/AuthContext.tsx` | Profile needs team_id awareness; `isCoach` must check user belongs to current team |
| `src/App.tsx` | Wrap routes with `TeamProvider`, add `/t/[slug]` route prefix |
| `src/components/Layout.tsx` | Pass team context for branding (logo, colors) |
| `src/components/Navbar.tsx` | Dynamic team name/logo instead of hardcoded "Cardinal Track" |
| `src/pages/Dashboard.tsx` | Scope stats/meets to current team |
| `src/pages/Roster.tsx` | Scope athletes to current team |
| `src/pages/Meets.tsx` | Scope meets to current team |
| `src/pages/Settings.tsx` | Scope user management to current team |
| `src/lib/hytek-export.ts` | Team code/name from team record instead of hardcoded `BISH` |

**Risk:** 🔴 HIGH — This is the foundational change. Every data query must be scoped.

### 8b. CSV Roster Upload

**Already partially exists!** `BulkImportModal.tsx` handles paste-based CSV import.

**Files to modify:**
| File | Changes |
|------|---------|
| `src/components/BulkImportModal.tsx` | Add file upload input (`<input type="file" accept=".csv">`), read file with FileReader, parse CSV |
| `src/pages/Roster.tsx` | Already wires BulkImportModal — may need minor UI updates |

**Risk:** 🟢 LOW — Incremental enhancement to existing feature.

### 8c. Open Parent/Athlete Signup with Favorites

**New files needed:**
| File | Purpose |
|------|---------|
| `src/pages/ParentSignup.tsx` | New signup page for parents (no approval needed) |
| `src/pages/FavoriteAthletes.tsx` | Page for parents to select/manage favorite athletes |
| `src/hooks/useFavorites.ts` | Hook for managing parent ↔ athlete favorites |
| `supabase/migrations/000XX_favorites.sql` | `favorites` table (id, profile_id FK, athlete_id FK, created_at) |

**Files to modify:**
| File | Changes |
|------|---------|
| `src/contexts/AuthContext.tsx` | `signUp()` needs to support parent role (currently forces all signups to coach) |
| `src/pages/Register.tsx` | Rename to coach-only registration; new parent flow is separate |
| `src/pages/Login.tsx` | Update "continue as parent" flow to point to parent signup |
| `src/App.tsx` | Add routes: `/signup`, `/favorites` |
| `src/pages/AthleteDetail.tsx` | Add "favorite" button for logged-in parents |
| `src/pages/PublicSearch.tsx` | Add "favorite" button in search results |

**Risk:** 🟡 MEDIUM — New auth flow; must not break existing coach signup.

### 8d. Mobile-First Responsive

**Files to modify:**
| File | Changes |
|------|---------|
| `src/pages/MeetDetail.tsx` | Grid view needs mobile-friendly redesign (event tabs → horizontal scroll or accordion) |
| `src/pages/MeetReport.tsx` | Table → card layout on mobile |
| `src/components/BulkImportModal.tsx` | Preview table → stacked cards on mobile |
| `src/components/AthleteAssignModal.tsx` | Already good (bottom-sheet pattern), minor touch improvements |
| `src/components/EventCard.tsx` | Good as-is, verify touch targets ≥ 44px |
| `src/pages/Roster.tsx` | Inline edit needs touch-friendly alternative |
| `src/index.css` | Add any missing mobile utilities |
| `tailwind.config.js` | May need additional breakpoints or utilities |

**Risk:** 🟢 LOW — Mostly CSS/layout changes, no logic changes.

### 8e. TFRRS Auto-Linking After Meets

**New files needed:**
| File | Purpose |
|------|---------|
| `src/lib/tfrrs.ts` | TFRRS API integration / scraping logic |
| `src/components/TFRRSLink.tsx` | Component to display TFRRS link/badge per athlete |
| `supabase/migrations/000XX_tfrrs_links.sql` | Add `tfrrs_id` column to `athletes` table, or create `tfrrs_links` table |

**Files to modify:**
| File | Changes |
|------|---------|
| `src/types/database.ts` | Add `tfrrs_id` or `tfrrs_url` to Athlete type |
| `src/pages/AthleteDetail.tsx` | Show TFRRS link/stats if available |
| `src/pages/MeetReport.tsx` | Optional TFRRS links per athlete |
| `src/pages/MeetDetail.tsx` | "Sync with TFRRS" button post-meet |

**Risk:** 🟡 MEDIUM — Depends on TFRRS API availability/stability. May need server-side function (Supabase Edge Function) for scraping.

### 8f. Landing Page + Stripe $300/Season Paywall

**New files needed:**
| File | Purpose |
|------|---------|
| `src/pages/Landing.tsx` | Public marketing/sales page for Cardinal Track SaaS |
| `src/pages/Pricing.tsx` | Pricing page ($300/season) |
| `src/pages/TeamOnboarding.tsx` | New team setup wizard (after payment) |
| `src/lib/stripe.ts` | Stripe Checkout integration |
| `supabase/functions/stripe-webhook/` | Supabase Edge Function for Stripe webhooks |
| `supabase/functions/create-checkout/` | Supabase Edge Function to create Stripe Checkout session |
| `supabase/migrations/000XX_team_subscriptions.sql` | Subscription status fields on teams table |

**Files to modify:**
| File | Changes |
|------|---------|
| `src/App.tsx` | Landing page as default `/`, team dashboard moves to `/t/[slug]` |
| `src/components/Layout.tsx` | Different layout for landing page vs team dashboard |
| `index.html` | Update title/description for SaaS marketing |
| `tailwind.config.js` | May need additional brand colors for marketing site |

**Risk:** 🔴 HIGH — Introduces payment, requires server-side logic (Edge Functions), Stripe account setup, subscription management.

### 8g. URL Routing (`/t/[slug]`) with Bishop Snyder Redirect

**Files to modify:**
| File | Changes |
|------|---------|
| `src/App.tsx` | **Major rewrite**: nest all team routes under `/t/:slug/*`, add redirect from `/` to `/t/bishop-snyder` for existing users |
| `vercel.json` | Keep SPA rewrite, may need additional redirects |
| `src/components/Layout.tsx` | Read team slug from URL params |
| `src/contexts/TeamContext.tsx` | (New) resolve team from slug |

**Route transformation:**
```
CURRENT                    → v2
/                          → /t/:slug (or landing page at /)
/roster                    → /t/:slug/roster
/meets                     → /t/:slug/meets
/meets/:id                 → /t/:slug/meets/:id
/meets/:id/report          → /t/:slug/meets/:id/report
/events                    → /t/:slug/events
/athletes/:id              → /t/:slug/athletes/:id
/search                    → /t/:slug/search
/settings                  → /t/:slug/settings
/login                     → /login (global)
/register                  → /register (global)
```

**Bishop Snyder backward compatibility:**
- The current site (presumably at `cardinaltrack.app` or similar) should redirect all bare paths to `/t/bishop-snyder/*`
- OR: Keep `/` → auto-redirect to `/t/bishop-snyder` if that's the only team initially

**Risk:** 🟡 MEDIUM — URL changes affect bookmarks and shared links. Need redirects.

---

## 9. Risk Assessment

### What Could Break Bishop Snyder's Current Experience

| Risk | Severity | Mitigation |
|------|----------|------------|
| **URL changes break bookmarks** | 🔴 High | Add redirects: `/roster` → `/t/bishop-snyder/roster`, etc. Keep redirects permanently. |
| **Missing team_id backfill** | 🔴 High | Migration MUST backfill all existing athletes, meets, meet_entries, profiles with Bishop Snyder's team_id. Null team_id = data invisible. |
| **RLS policy changes lock out coaches** | 🔴 High | Test policies on staging first. Keep existing policies active until new ones proven. |
| **Auth context changes break sign-in** | 🟡 Medium | Existing sessions use Supabase auth — keep backward compatible. Profile must still work without team_id initially. |
| **Performance regression from team scoping** | 🟡 Medium | Add index on `team_id` columns. Queries add one WHERE clause — minimal impact. |
| **Branding changes** | 🟢 Low | Keep Bishop Snyder colors/logo as their team config. Default theme should match current. |
| **Event data shared across teams** | 🟢 Low | Events are universal to track & field — sharing is correct. No change needed. |
| **Hardcoded admin emails** | 🟡 Medium | Move admin check to team-level. Jacob should be global admin; Gregory Bing should be Bishop Snyder team admin. |
| **Hy-Tek export hardcoded team** | 🟢 Low | Update `hytek-export.ts` to use team data — simple refactor. |
| **Public search shows all teams' athletes** | 🟡 Medium | Scope `/search` to current team's athletes (by URL context). |

### Data Integrity Checklist for Migration
1. ✅ Create `teams` table with Bishop Snyder as first row
2. ✅ Add `team_id` column to `athletes`, `meets`, `profiles` (nullable initially)
3. ✅ Backfill all existing rows with Bishop Snyder's team_id
4. ✅ Make `team_id` NOT NULL after backfill
5. ✅ Update RLS policies to scope by team_id
6. ✅ Test that existing coaches can still log in and manage data
7. ✅ Test that public search still works for Bishop Snyder

---

## 10. Recommended Build Order

### Phase 1: Foundation (Backend-First) — Est. 3-4 days

| Step | Task | Complexity | Risk |
|------|------|-----------|------|
| 1.1 | Create `teams` table + seed Bishop Snyder team | 🟢 Easy | Low |
| 1.2 | Add `team_id` to `athletes`, `meets`, `profiles` + backfill migration | 🟡 Medium | **HIGH** — must not lose data |
| 1.3 | Update RLS policies for team-scoped writes | 🟡 Medium | HIGH — test thoroughly |
| 1.4 | Create `TeamContext.tsx` + `useTeam.ts` | 🟢 Easy | Low |
| 1.5 | Update all hooks to accept + filter by `team_id` | 🟡 Medium | Medium |

**Checkpoint:** Bishop Snyder works exactly as before, but all data has team_id.

### Phase 2: URL Routing — Est. 1-2 days

| Step | Task | Complexity | Risk |
|------|------|-----------|------|
| 2.1 | Restructure `App.tsx` routes under `/t/:slug/*` | 🟡 Medium | Medium |
| 2.2 | Add redirects from old paths to `/t/bishop-snyder/*` | 🟢 Easy | Low |
| 2.3 | Update all `<Link>` components to use team slug | 🟡 Medium | Medium |
| 2.4 | Update `Layout.tsx` / `Navbar.tsx` for dynamic team | 🟢 Easy | Low |

**Checkpoint:** All existing URLs redirect correctly. Bishop Snyder users see no difference.

### Phase 3: Multi-Team Branding — Est. 1 day

| Step | Task | Complexity | Risk |
|------|------|-----------|------|
| 3.1 | Dynamic team logo + name in Navbar/Layout | 🟢 Easy | Low |
| 3.2 | Dynamic color theme from team record | 🟡 Medium | Low |
| 3.3 | Update `hytek-export.ts` to use team data | 🟢 Easy | Low |

**Checkpoint:** Can create new teams with different branding.

### Phase 4: CSV Roster Upload Enhancement — Est. 0.5 day

| Step | Task | Complexity | Risk |
|------|------|-----------|------|
| 4.1 | Add file input to `BulkImportModal.tsx` | 🟢 Easy | Low |

**Checkpoint:** Coaches can upload `.csv` files directly.

### Phase 5: Parent/Athlete Signup + Favorites — Est. 2-3 days

| Step | Task | Complexity | Risk |
|------|------|-----------|------|
| 5.1 | Create `favorites` table + migration | 🟢 Easy | Low |
| 5.2 | Build `ParentSignup.tsx` (no approval needed) | 🟡 Medium | Medium |
| 5.3 | Update `AuthContext.tsx` signUp for parent role | 🟡 Medium | Medium |
| 5.4 | Build `FavoriteAthletes.tsx` + favorite toggle on athlete pages | 🟡 Medium | Low |

**Checkpoint:** Parents can sign up, favorite athletes, and view their assignments.

### Phase 6: Mobile-First Polish — Est. 1-2 days

| Step | Task | Complexity | Risk |
|------|------|-----------|------|
| 6.1 | Audit all pages at 375px width | 🟢 Easy | Low |
| 6.2 | Fix MeetDetail grid view for mobile | 🟡 Medium | Low |
| 6.3 | Fix MeetReport table for mobile | 🟢 Easy | Low |
| 6.4 | Improve touch targets (≥44px) | 🟢 Easy | Low |

**Checkpoint:** All pages work great on iPhone SE → iPad → Desktop.

### Phase 7: Landing Page + Stripe Paywall — Est. 3-4 days

| Step | Task | Complexity | Risk |
|------|------|-----------|------|
| 7.1 | Build `Landing.tsx` marketing page | 🟡 Medium | Low |
| 7.2 | Set up Stripe account + products ($300/season) | 🟡 Medium | Medium |
| 7.3 | Create Supabase Edge Functions for Stripe webhook + checkout | 🔴 Hard | High |
| 7.4 | Build `TeamOnboarding.tsx` post-payment flow | 🟡 Medium | Medium |
| 7.5 | Gate team creation behind payment | 🟡 Medium | Medium |
| 7.6 | Bishop Snyder grandfathered (free) | 🟢 Easy | Low |

**Checkpoint:** New teams can sign up, pay, and start using the platform.

### Phase 8: TFRRS Auto-Linking — Est. 2-3 days

| Step | Task | Complexity | Risk |
|------|------|-----------|------|
| 8.1 | Research TFRRS API / scraping approach | 🟡 Medium | **Medium — may not be possible** |
| 8.2 | Add `tfrrs_id` to athletes table | 🟢 Easy | Low |
| 8.3 | Build TFRRS lookup/linking UI | 🟡 Medium | Medium |
| 8.4 | Post-meet "sync with TFRRS" button | 🟡 Medium | Medium |

**Checkpoint:** Athletes can be linked to TFRRS profiles; results visible in app.

---

### Total Estimated Timeline

| Phase | Duration | Can Parallelize? |
|-------|----------|-----------------|
| Phase 1: Foundation | 3-4 days | No — must go first |
| Phase 2: URL Routing | 1-2 days | No — depends on Phase 1 |
| Phase 3: Multi-Team Branding | 1 day | After Phase 2 |
| Phase 4: CSV Upload | 0.5 day | ✅ After Phase 1 |
| Phase 5: Parent Signup | 2-3 days | ✅ After Phase 2 |
| Phase 6: Mobile Polish | 1-2 days | ✅ Anytime |
| Phase 7: Landing + Stripe | 3-4 days | ✅ After Phase 2 |
| Phase 8: TFRRS | 2-3 days | ✅ After Phase 1 |

**Total: ~14-19 working days** (with parallelization, ~10-12 days if multiple features built simultaneously)

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 7 (foundation + routing + branding + payments)

---

### Summary

The codebase is clean, well-structured, and relatively small (~3,500 lines of source code). The single-team assumption is baked in at the data layer (no team_id anywhere) but the UI is well-componentized and the Tailwind approach makes theming straightforward.

The biggest risk is **Phase 1** (adding team_id to everything). This must be done carefully with a proper migration strategy. The recommended approach:

1. Add columns as **nullable** first
2. Backfill with Bishop Snyder's team_id
3. Then set to **NOT NULL**
4. Update RLS policies
5. Deploy in a single migration batch

Bishop Snyder's current experience should survive untouched if:
- All existing data gets backfilled with their team_id
- URL redirects from old paths to `/t/bishop-snyder/*` are permanent
- The hardcoded admin emails are preserved (or migrated to a team admin system)
- Public read access remains enabled for their team's data
