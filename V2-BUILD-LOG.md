# V2 Build Log — Multi-Team Foundation

**Built:** 2025-07-11  
**Phases Completed:** 1 (Foundation), 2 (URL Routing), 4 (CSV Upload), 6 (Mobile Polish)  
**Build Status:** ✅ Compiles & builds successfully  
**Deployment:** LOCAL ONLY — NOT deployed to Vercel  

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
