# CLAUDE_CONTEXT.md — TFC Client Portal Session Handoff

---

## PROJECT: TFC Client Portal

### What This Is
A white-label client portal for The Full Collection (a content production agency). Team members manage content pipelines, invoices, and client communication; clients track their content through a kanban board, complete onboarding, and view deliverables. No public-facing marketing site — this is an internal ops tool.

### Tech Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database / Auth:** Supabase (Postgres + Supabase Auth, service role key for all server-side ops)
- **Email:** Resend (`hello@thefullcollection.com` — domain verified)
- **Payments:** Stripe (checkout sessions + webhooks)
- **AI:** Anthropic SDK (`claude-sonnet-4-6` for script/content generation)
- **Google Drive:** OAuth2 via `googleapis` — token stored encrypted in `clients.google_drive_token` (jsonb)
- **Deployment:** Vercel (inferred from `.vercel/` directory)
- **Styling:** Tailwind CSS + CSS custom properties (dark/light theme via `[data-theme]`)
- **Fonts:** DM Sans (body), heading class also DM Sans

---

### Current File Structure

```
tfc-portal/
├── app/
│   ├── api/
│   │   ├── activity/route.ts
│   │   ├── ai/
│   │   │   ├── generate/route.ts
│   │   │   └── generate-ideas/route.ts
│   │   ├── auth/reset-password/route.ts
│   │   ├── client-assignments/route.ts
│   │   ├── clients/
│   │   │   ├── route.ts
│   │   │   └── setup/route.ts            ← new: client account activation
│   │   ├── cron/
│   │   │   ├── purge-trash/route.ts
│   │   │   └── reminders/route.ts
│   │   ├── drive/
│   │   │   ├── callback/route.ts
│   │   │   ├── connect/route.ts
│   │   │   └── route.ts
│   │   ├── export/route.ts
│   │   ├── invites/
│   │   │   ├── accept/route.ts           ← refactored: fully server-side
│   │   │   ├── validate/route.ts
│   │   │   └── route.ts
│   │   ├── invoices/
│   │   │   ├── pay/route.ts
│   │   │   └── route.ts
│   │   ├── kanban/
│   │   │   ├── comments/route.ts
│   │   │   └── route.ts
│   │   ├── messages/route.ts
│   │   ├── notifications/route.ts
│   │   ├── resources/route.ts
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── subscription/route.ts
│   │   ├── team-conversations/route.ts
│   │   ├── team-members/
│   │   │   ├── [id]/route.ts
│   │   │   └── route.ts
│   │   ├── team-messages/route.ts
│   │   ├── trash/route.ts
│   │   └── upload-avatar/route.ts
│   ├── checkout/
│   │   ├── page.tsx
│   │   └── success/page.tsx
│   ├── dashboard/
│   │   ├── DashboardClient.tsx           ← client portal main view
│   │   └── page.tsx
│   ├── globals.css                       ← all CSS variables + component classes
│   ├── layout.tsx
│   ├── login/
│   │   ├── LoginClient.tsx
│   │   └── page.tsx
│   ├── onboarding/
│   │   ├── OnboardingClient.tsx
│   │   └── page.tsx                      ← 8-step questionnaire for new clients
│   ├── page.tsx                          ← redirects to /dashboard or /login
│   ├── reset-password/
│   │   ├── ResetPasswordClient.tsx
│   │   └── page.tsx
│   ├── setup/
│   │   ├── SetupClient.tsx               ← new: client account activation
│   │   └── page.tsx
│   ├── team/
│   │   ├── accept/                       ← team invite acceptance
│   │   ├── login/
│   │   ├── portal/                       ← team portal main view
│   │   ├── setup/                        ← owner initial setup
│   │   └── welcome/                      ← post-invite profile setup (confetti)
│   └── welcome/                          ← client post-onboarding welcome
├── components/
│   ├── AIWriter.tsx
│   ├── AnalyticsDashboard.tsx
│   ├── CardDetailModal.tsx
│   ├── ClientAssignments.tsx
│   ├── ClientHealthDashboard.tsx
│   ├── ClientHome.tsx
│   ├── ContentBrief.tsx
│   ├── ContentCalendar.tsx
│   ├── ContentDatabase.tsx
│   ├── DriveFiles.tsx
│   ├── FAQ.tsx
│   ├── GlobalSearch.tsx
│   ├── IdeaSwiper.tsx
│   ├── IntakeView.tsx
│   ├── InvoiceSection.tsx
│   ├── Kanban.tsx
│   ├── MessageThread.tsx
│   ├── NotificationBell.tsx
│   ├── OnboardingWizard.tsx
│   ├── ResourceLibrary.tsx
│   ├── SubscriptionSection.tsx
│   ├── TeamManagement.tsx
│   ├── TeamMemberDetail.tsx
│   ├── TeamMessenger.tsx
│   ├── TrashBin.tsx
│   └── ui/
│       ├── Avatar.tsx
│       ├── ErrBox.tsx
│       └── Logo.tsx
├── emails/
│   ├── ClientWelcome.tsx
│   ├── PasswordReset.tsx
│   ├── StatusNotification.tsx
│   └── TeamInvite.tsx
├── lib/
│   ├── auth-helpers.ts                   ← requireTeamMember, requireClientAccess
│   ├── constants.ts                      ← COLUMNS, STEP_TITLES, COLORS, OnboardingData shape
│   ├── crypto.ts
│   ├── kanban-notifications.ts           ← notification routing on column transitions
│   ├── rate-limit.ts                     ← in-memory sliding window (replace w/ Redis at scale)
│   ├── resend.ts                         ← all email send functions
│   ├── stripe.ts
│   ├── supabase-browser.ts               ← createBrowserSupabase()
│   ├── supabase-server.ts                ← createServerSupabase()
│   ├── supabase.ts                       ← createSupabaseAdmin()
│   ├── theme.ts
│   ├── tiers.ts                          ← TIERS: starter/core/premium pricing
│   └── use-realtime.ts
├── middleware.ts                         ← public path whitelist + auth redirect
├── supabase/
│   ├── migrations/
│   │   ├── 001_proper_rls.sql
│   │   ├── 002_client_assignments.sql
│   │   ├── 003_team_member_profiles.sql
│   │   ├── 004_client_profiles.sql
│   │   ├── 005_team_messaging.sql
│   │   ├── 006_kanban_extras.sql
│   │   └── 007_client_setup_code.sql
│   └── schema.sql                        ← canonical full schema
└── tailwind.config.ts
```

---

### Architecture Decisions (Non-Negotiable)

1. **No public signup.** Clients are created by owner/admin only via `POST /api/clients`. Team members via invite only. Owner has one account seeded at setup.
2. **All Supabase operations use service role key server-side.** Never use anon key for data writes. `createSupabaseAdmin()` is used in all API routes.
3. **Auth user creation is always server-side via `admin.createUser` with `email_confirm: true`.** Never use `supabase.auth.signUp` from the browser (anon key) — this is blocked by Supabase email confirmation and causes an immediate `signInWithPassword` failure.
4. **Invite/setup code flows are single-API-call + client signIn.** Server does: validate code → create auth user → create record → clear code (atomic with rollback). Client does: call API → signIn.
5. **Resend sends all emails.** FROM is always `The Full Collection <hello@thefullcollection.com>`. Domain verified in Resend. No raw SMTP.
6. **Kanban notifications are fire-and-forget.** Never `await` notification side effects inside request handlers. Use `.catch(() => {})` to swallow errors.
7. **Owner/admin role required to create clients or send invites.** `requireTeamMember` checks team membership; actor role check (`owner` / `admin`) is a separate query.
8. **Clients can only access their own data.** `requireClientAccess(email, clientId)` — team members pass automatically; clients must match both email AND id.
9. **Google Drive OAuth tokens stored encrypted in `clients.google_drive_token` (jsonb).** Never expose raw token to client.
10. **Soft-delete pattern for kanban cards, messages, and resources.** `deleted_at timestamptz` column. Trash bin reads these; purge cron hard-deletes after TTL.
11. **Rate limiting is in-memory (per-process).** `lib/rate-limit.ts` uses a Map. Fine for single-instance Vercel serverless. Replace with Redis (`@upstash/ratelimit`) if multi-region.
12. **Stripe checkout creates the client record via webhook**, not via direct API call. `checkout.session.completed` event → insert client + send welcome email. Do not duplicate this in the checkout route itself.
13. **`setup_code` on clients is UNIQUE TEXT.** Generated as 8-char alphanumeric (no ambiguous chars: no 0/O/I/1). Cleared to NULL on activation so it can't be reused.

---

### Design System

**CSS Variables (defined in `globals.css`, mirrored in `lib/constants.ts` as `COLORS`):**

```
Dark mode (default):
--color-bg:        #0A0A0A   (page background)
--color-surface:   #111111   (cards, panels)
--color-surface-2: #181818   (code blocks, inputs bg)
--color-surface-3: #202020   (deeper nesting)
--color-border:    #252525
--color-border-2:  #2E2E2E
--color-text:      #F0EDE6   (primary text)
--color-text-2:    #A8A49C   (secondary text)
--color-text-3:    #5A5652   (labels, placeholder)

Light mode ([data-theme="light"]):
--color-bg:        #F2F0EC
--color-surface:   #FFFFFF
--color-surface-2: #EDEBE7
--color-surface-3: #E6E3DE
--color-border:    #DDD9D3
--color-border-2:  #CFCBC4
--color-text:      #1A1917
--color-text-2:    #6B6660
--color-text-3:    #9E9892

Accent:
red:      #E02020   (primary action, brand)
redLight: #FF3B3B   (admin badge)
```

**Tailwind aliases:** `bg-bg`, `bg-surface`, `bg-surface-2`, `bg-surface-3`, `border-border`, `border-border-2`, `text-text`, `text-text-2`, `text-text-3`, `bg-red`, `text-red`

**Component classes (all in `globals.css`):**
- `.tfc-input` — 44px min-height, focus ring #E02020, error state border #EF4444
- `.tfc-textarea` — same rules, resize-y
- `.tfc-btn` — #E02020 bg, white text, uppercase, 44px min-height
- `.tfc-btn-ghost` — transparent, border, uppercase
- `.tfc-label` — 11px, uppercase, tracking-[0.1em], text-3 color
- `.tfc-pill` — selectable pill (active = red bg)

**Font:** DM Sans everywhere. `font-body` = DM Sans, `font-heading` = DM Sans bold.

**Mobile-first.** Design for 390px first, desktop second. All tap targets 44px min-height.

---

### Data Models

#### clients
```ts
{
  id: uuid (PK)
  name: text
  email: text UNIQUE
  onboarding_complete: boolean DEFAULT false
  onboarding_data: jsonb (OnboardingData shape — see constants.ts)
  created_at: timestamptz
  created_by: text (email of team member who created)
  google_drive_token: jsonb (encrypted OAuth token)
  stripe_customer_id: text
  stripe_subscription_id: text
  subscription_status: text DEFAULT 'active'
  subscription_tier: text ('starter' | 'core' | 'premium')
  phone: text
  address: text
  bio: text
  avatar_url: text
  industry: text
  profile_complete: boolean DEFAULT false
  last_seen_at: timestamptz (updated on GET /api/clients?email=)
  setup_code: text UNIQUE (cleared to NULL after account activation)
}
```

#### team_members
```ts
{
  id: uuid (PK)
  name: text
  email: text UNIQUE
  role: text ('owner' | 'admin' | 'editor' | 'project_manager' | 'social_media_manager')
  created_at: timestamptz
  invited_by: text (email)
  bio: text
  avatar_url: text
}
```

#### team_invites
```ts
{
  id: uuid (PK)
  code: text UNIQUE
  email: text
  name: text
  role: text
  used: boolean DEFAULT false
  invited_by: text (email)
  created_at: timestamptz
}
```

#### kanban_cards
```ts
{
  id: uuid (PK)
  client_id: uuid FK→clients
  column_id: ColumnId (see Kanban section)
  title: text
  description: text
  platform: text
  position: integer
  due_date: date
  priority: text ('low' | 'medium' | 'high')
  created_by: text
  content_style: text
  content_type: text
  reference_url: text
  unedited_url: text
  edited_video_url: text
  assigned_editor: text
  shoot_date: date
  edit_deadline: date
  publish_date: date
  shoot_location: text
  revision_notes: text
  is_evergreen: boolean DEFAULT false
  deleted_at: timestamptz (soft-delete)
  created_at: timestamptz
  updated_at: timestamptz
}
```

#### card_comments
```ts
{
  id: uuid (PK)
  card_id: uuid FK→kanban_cards
  author_email: text
  author_name: text
  author_type: text ('team' | 'client')
  content: text
  created_at: timestamptz
}
```

#### messages (client ↔ team DMs)
```ts
{
  id: uuid (PK)
  client_id: uuid FK→clients
  sender_email: text
  sender_name: text
  sender_type: text ('team' | 'client')
  content: text
  thread_parent_id: uuid FK→messages (nullable)
  message_type: text DEFAULT 'text'
  mentions: jsonb DEFAULT []
  voice_url: text
  voice_duration: real
  deleted_at: timestamptz
  created_at: timestamptz
}
```

#### notifications
```ts
{
  id: uuid (PK)
  recipient_email: text
  recipient_type: text ('team' | 'client')
  title: text
  message: text
  link: text
  type: text ('kanban_move' | 'shoot_date' | ...)
  read: boolean DEFAULT false
  created_at: timestamptz
}
```

#### resources
```ts
{
  id: uuid (PK)
  client_id: uuid FK→clients
  name: text
  type: text
  url: text
  file_path: text
  category: text
  description: text
  uploaded_by: text
  file_size: bigint
  deleted_at: timestamptz
  created_at: timestamptz
}
```

#### invoices
```ts
{
  id: uuid (PK)
  client_id: uuid FK→clients
  title: text
  amount: decimal
  currency: text DEFAULT 'USD'
  due_date: date
  description: text
  status: text ('pending' | 'paid' | 'overdue')
  stripe_invoice_id: text
  stripe_payment_url: text
  created_at: timestamptz
  updated_at: timestamptz
}
```

#### activity_log
```ts
{
  id: uuid (PK)
  client_id: uuid FK→clients
  actor_email: text
  actor_name: text
  actor_type: text
  action: text
  metadata: jsonb
  created_at: timestamptz
}
```

#### client_assignments (migration 002)
```ts
{
  id: uuid (PK)
  client_id: uuid FK→clients
  team_member_email: text
  created_at: timestamptz
  UNIQUE(client_id, team_member_email)
}
```

#### team_conversations (migration 005)
```ts
{
  id: uuid (PK)
  name: text
  type: text ('channel' | 'dm' | 'group')
  description: text
  created_by: text FK→team_members.email
  is_default: boolean DEFAULT false
  created_at: timestamptz
}
```

#### team_conversation_members (migration 005)
```ts
{
  id: uuid (PK)
  conversation_id: uuid FK→team_conversations
  member_email: text FK→team_members.email
  last_read_at: timestamptz
  joined_at: timestamptz
  UNIQUE(conversation_id, member_email)
}
```

#### team_messages (migration 005)
```ts
{
  id: uuid (PK)
  conversation_id: uuid FK→team_conversations
  sender_email: text FK→team_members.email
  content: text
  reply_to_id: uuid FK→team_messages (nullable)
  edited: boolean DEFAULT false
  created_at: timestamptz
  updated_at: timestamptz
}
```

---

### Storage / DB Schema

**Supabase Project:** `ojgaphhkajdurzkysprc` (prod)
**RLS:** Enabled on all tables. Most tables use broad `authenticated` policies — enforcement is at the API layer via `requireTeamMember` / `requireClientAccess`. Tables with tighter RLS: `client_assignments`, `team_conversations`, `team_conversation_members`, `team_messages` (use `is_team_member()` db function).

**Supabase Storage buckets:**
- `avatars` — profile pictures for team members and clients

**Migrations applied in order:** 001→002→003→004→005→006→007

---

### Auth Flow

**Owner login:**
1. Owner account exists in `team_members` (email: `blake@status10inc.com`). Created manually or via `app/team/setup` owner setup flow.
2. Navigate to `/team/login` → `signInWithPassword` → redirect to `/team/portal`.

**Team member onboarding:**
1. Owner/admin creates invite via Team Management UI → `POST /api/invites` → inserts `team_invites` record + sends `TeamInviteEmail` with code.
2. Invitee clicks "Accept Invite" link → `/team/accept?code=XXXX`.
3. Form: invite code (pre-filled) + full name + password + confirm (min 8 chars).
4. `POST /api/invites/accept` (server-side, rate-limited):
   - Atomically claims invite (`UPDATE WHERE used=false`)
   - `admin.createUser({ email, password, email_confirm: true })`
   - Inserts `team_members` record
   - Full rollback on any failure (un-claim invite + delete auth user)
   - Returns `{ email }`
5. Client calls `signInWithPassword` → redirect to `/team/welcome` (profile setup: avatar + bio + celebration).

**Client onboarding:**
1. Owner/admin creates client via Clients UI or Stripe webhook → `POST /api/clients`:
   - Generates 8-char `setup_code`
   - Inserts `clients` record with `setup_code`
   - Sends `ClientWelcomeEmail` with code
2. Client clicks "Get Started" → `/setup?code=XXXX`.
3. Form: setup code (pre-filled) + password + confirm (min 8 chars).
4. `PATCH /api/clients/setup` (server-side):
   - Looks up client by code
   - `admin.createUser({ email, password, email_confirm: true })`
   - Clears `setup_code` to NULL
   - Returns `{ email }`
5. Client calls `signInWithPassword` → redirect to `/onboarding` (8-step questionnaire).
6. After onboarding: `onboarding_complete = true` → redirect to `/dashboard`.

**Password reset:**
1. Client clicks "Forgot Password" on login page → `POST /api/auth/reset-password` → Supabase generates recovery link → sends `PasswordResetEmail`.
2. Client clicks link → `/reset-password` (public path) → listens for `PASSWORD_RECOVERY` auth event → shows new password form → `supabase.auth.updateUser({ password })` → redirect to `/dashboard`.

**Middleware public paths:** `/login`, `/team/login`, `/team/setup`, `/team/accept`, `/checkout`, `/reset-password`, `/setup`

---

### Onboarding Flow

8 steps defined in `lib/constants.ts → STEP_TITLES`. All data saved to `clients.onboarding_data` (jsonb) on completion.

| # | Step Title | Data Collected |
|---|-----------|----------------|
| 1 | Define Your Positioning | `whoIHelp`, `helpAchieve`, `byDoing`, `soTheyCan` |
| 2 | Clarify Your Audience | `primaryAudience`, `notMyAudience`, `problems[]` (5), `desires[]` (5) |
| 3 | Content Pillars | `pillars[]` (5) |
| 4 | Tone & Point of View | `delivery`, `swears`, `noGoTopics`, `hotTakes[]` (3) |
| 5 | Content Formats | `formats[]` (multi-select), `lengthRange`, `hookStyle`, `captionStyle` |
| 6 | Reference Content | `references[]` (`{link, likes, copyVsAvoid}`) |
| 7 | Brand Assets & Links | `logoFiles`, `brandColors`, `fonts`, `website`, `instagram`, `tiktok`, `youtube`, `linkedin`, `brandGuidelines`, `pastContent` |
| 8 | Offer Clarity | `offerName`, `pricePoint`, `whoItsFor`, `callToAction` |

---

### Kanban

9 columns in order (defined in `lib/constants.ts → COLUMNS`):

| id | Label | Color | Meaning |
|----|-------|-------|---------|
| `idea` | Idea | #6B7280 | Concept stage, not yet filmed |
| `filmed` | Filmed | #3B82F6 | Raw footage captured |
| `editing` | Editing | #F59E0B | In editor's hands |
| `edited_qcc` | Edited QCC | #A78BFA | Edited, awaiting QC/owner review |
| `ready_review` | Ready for Review | #EC4899 | Client-facing review requested |
| `approved` | Approved for Publish | #10B981 | Client approved, ready to schedule |
| `revise` | Revise | #EF4444 | Sent back, revision needed |
| `scheduled` | Scheduled | #06B6D4 | Queued for posting |
| `published` | Published | #E02020 | Live |

**Notification routing on column transition** (`lib/kanban-notifications.ts`):
- `filmed` → notify assigned editors
- `edited_qcc` → notify admin/owner
- `ready_review` → notify client (in-app + email)
- `approved` → notify social_media_managers
- `revise` → notify assigned editors
- `scheduled` → notify client (in-app + email)
- `published` → notify client (in-app + email)
- `idea`, `editing` → no notifications

Notifications are fire-and-forget (`.catch(() => {})`). Never block the PATCH response.

---

### API Routes

| Method | Path | Auth Required | What it does |
|--------|------|--------------|-------------|
| GET | `/api/clients` | Auth | List all clients (team only) or self-lookup by `?email=` |
| POST | `/api/clients` | Owner/Admin | Create client, generate setup_code, send welcome email |
| PATCH | `/api/clients` | Auth (self) | Update own bio/industry/avatar/profile_complete |
| POST | `/api/clients/setup` | None | Validate setup code, return email+name |
| PATCH | `/api/clients/setup` | None | Activate account: createUser + clear code |
| GET | `/api/team-members` | Team | List all team members |
| POST | `/api/team-members` | Owner/Admin | (via invite flow) |
| PATCH | `/api/team-members` | Auth (self) | Update own bio/avatar |
| DELETE | `/api/team-members/[id]` | Owner/Admin | Remove team member + delete auth user |
| POST | `/api/invites` | Owner/Admin | Create invite record + send TeamInviteEmail |
| POST | `/api/invites/validate` | None | Validate code (not used), return email/name/role |
| POST | `/api/invites/accept` | None (rate-limited) | Atomic: validate + createUser + createTeamMember + markUsed |
| GET/POST/PATCH/DELETE | `/api/kanban` | Auth | CRUD kanban cards; PATCH triggers notifications |
| GET/POST | `/api/kanban/comments` | Auth | Card comments |
| GET/POST | `/api/messages` | Auth | Client ↔ team messages (scoped to client_id) |
| GET/POST/DELETE | `/api/client-assignments` | Team | Assign team members to clients |
| GET/POST/PATCH/DELETE | `/api/invoices` | Auth | Invoice CRUD; clients can only read own |
| POST | `/api/invoices/pay` | Auth | Create Stripe payment link |
| POST | `/api/stripe/checkout` | None | Create Stripe checkout session for new clients |
| POST | `/api/stripe/webhook` | Stripe sig | Handle `checkout.session.completed` → create client |
| GET/POST/DELETE | `/api/resources` | Auth | File/link resource library per client |
| GET | `/api/notifications` | Auth | Fetch own notifications |
| PATCH | `/api/notifications` | Auth | Mark notifications read |
| GET | `/api/activity` | Team | Activity log per client |
| POST | `/api/upload-avatar` | Auth | Upload to Supabase storage `avatars` bucket |
| POST | `/api/auth/reset-password` | None | Send Supabase password reset email via Resend |
| POST | `/api/ai/generate` | Auth | Anthropic: generate content script |
| POST | `/api/ai/generate-ideas` | Auth | Anthropic: generate content ideas |
| GET | `/api/drive/connect` | Auth | Start Google OAuth flow |
| GET | `/api/drive/callback` | Auth | Exchange OAuth code, store token |
| GET | `/api/drive` | Auth | List Google Drive files |
| GET | `/api/export` | Team | Export client data as CSV/JSON |
| POST | `/api/cron/purge-trash` | Cron secret | Hard-delete soft-deleted items past TTL |
| POST | `/api/cron/reminders` | Cron secret | Send deadline reminder notifications |
| GET/POST/DELETE | `/api/team-conversations` | Team | Team channel/DM management |
| GET/POST | `/api/team-messages` | Team | Team messenger messages |
| GET/POST/DELETE | `/api/trash` | Auth | Soft-deleted items management |
| GET | `/api/subscription` | Auth | Client subscription status |

---

### Email (Resend)

**FROM:** `The Full Collection <hello@thefullcollection.com>` (domain verified in Resend)
**All send functions in:** `lib/resend.ts`

| Template | File | Trigger | Content |
|----------|------|---------|---------|
| `TeamInviteEmail` | `emails/TeamInvite.tsx` | `POST /api/invites` | Invite code in monospace box, link to `/team/accept?code=` |
| `ClientWelcomeEmail` | `emails/ClientWelcome.tsx` | `POST /api/clients` or `stripe/webhook` | Login email + setup code in monospace box, "Get Started" button to `/setup?code=` |
| `StatusNotificationEmail` | `emails/StatusNotification.tsx` | Kanban move to `ready_review`, `scheduled`, `published` | Content title + new status |
| `PasswordResetEmail` | `emails/PasswordReset.tsx` | `POST /api/auth/reset-password` | Reset link to `/reset-password` |

All templates use `@react-email/components`. Dark background (#0A0A0A), red (#E02020) accent bar, DM Sans font, off-white (#F0EDE6) text. Render via `resend.emails.send({ react: ComponentFn({...}) })`.

---

### Known Bugs Fixed

1. **Team invite: email confirmation race condition.** Root cause: `AcceptInviteClient` called `supabase.auth.signUp` (browser, anon key). If Supabase email confirmation is enabled, `signInWithPassword` immediately after fails with "Email not confirmed". Fix: moved auth user creation to server-side `admin.createUser({ email_confirm: true })` inside `POST /api/invites/accept`.

2. **Team invite: fragmented failure modes.** Root cause: 4 separate calls (validate → signUp → signIn → accept) — if `accept` failed, user had auth account but no `team_members` record and got stuck. Fix: collapsed into single API call with full rollback (un-claim invite + `admin.deleteUser` on insertErr).

3. **Client activation: wrong post-activation redirect.** Root cause: `SetupClient.tsx` hardcoded `router.push("/dashboard")`. Fix: changed to `router.push("/onboarding")` so new clients hit the 8-step questionnaire.

4. **`/reset-password` blocked by middleware.** Root cause: not in public paths whitelist. Unauthenticated users (who need to set password) were redirected to `/login`. Fix: added `/reset-password` and `/setup` to `publicPaths` in `middleware.ts`.

5. **`@react-email/render` missing.** Root cause: email templates rendered via React but `@react-email/render` not installed. Fix: `npm install @react-email/render`.

6. **`ErrBox` prop name.** Root cause: component expects `msg={err}` but some call sites used `message={err}`. Fix: updated all call sites to use `msg`.

7. **Supabase `generateLink` "User not found".** Root cause: tried to generate recovery link for email with no auth user (client created without auth account in new flow). Fix: switched entire flow to setup code — no pre-created auth user needed.

8. **Welcome email missing button/code in sent email.** Root cause: old email template version was cached or not rebuilt. Fixed by complete template rewrite to code-based flow.

9. **DNS propagation for `thefullcollection.com` in Resend.** Three records added to IONOS: DKIM TXT (`resend._domainkey`), MX, SPF TXT. Domain now verified; FROM updated from `onboarding@resend.dev` to `hello@thefullcollection.com`.

10. **Merge conflict: `app/api/invites/accept/route.ts` had rate limiting on main** that wasn't in worktree branch. Fix: preserved `checkRateLimit` + `getClientIp` import and call in resolved merge.

---

### Last 5 Actions Taken

1. **DNS + Resend domain verification.** Added DKIM/MX/SPF records to IONOS for `thefullcollection.com`. Updated `FROM` in `lib/resend.ts`. Set up cron job to poll DNS, fired iMessage notification on verification.

2. **Email template pass.** Removed em dashes from all 4 templates (spam filter risk). Removed content board graphic from `ClientWelcome`. Added warm thank-you hero copy. Rebuilt `ClientWelcome` with code-based flow (monospace setup code box + "Get Started" button).

3. **Client setup code flow.** Replaced magic link onboarding with invite-code pattern:
   - Migration 007 added `setup_code TEXT UNIQUE` to `clients`
   - New `/setup` page + `SetupClient.tsx`
   - New `PATCH /api/clients/setup` (validate → createUser → clear code)
   - `POST /api/clients` generates code instead of calling `generateLink`
   - Login page gets "Activate your account →" link

4. **Password reset page.** Created `/reset-password/ResetPasswordClient.tsx` that listens for Supabase `PASSWORD_RECOVERY` auth event and shows a set-password form. Added to middleware public paths.

5. **Onboarding flow hardening.** Fixed both invite flows to use server-side auth user creation. `POST /api/invites/accept` now does everything atomically (validate + createUser + createTeamMember + markUsed) with rollback. `SetupClient.tsx` redirects to `/onboarding` instead of `/dashboard`.

---

### What's Next

Priority queue (as of last session):

1. **Test both invite flows end-to-end.** Send a real team invite to a test email and a real client invite. Verify `/team/welcome` profile setup works after invite acceptance.
2. **Stripe webhook → welcome email.** Verify `checkout.session.completed` correctly calls `sendClientWelcome` with the new `{ code, appUrl }` signature (the webhook was written before the code-based refactor — may still pass `resetLink`).
3. **Client health dashboard.** `last_seen_at` is tracked; `ClientHealthDashboard.tsx` exists. Verify it's wired up and surfaced in the team portal.
4. **Google Drive integration.** `DriveFiles.tsx`, `app/api/drive/` routes, OAuth flow all exist. End-to-end test needed.
5. **Cron jobs.** `purge-trash` and `reminders` routes exist but need Vercel cron config in `vercel.json`.

---

### Rules for Future Sessions

1. **Never use `supabase.auth.signUp` from the browser.** Always create auth users server-side via `admin.createUser({ email_confirm: true })`.
2. **Notification side effects are always fire-and-forget.** Use `.catch(() => {})`. Never `await` notifications inside a request handler.
3. **All Supabase data operations use `createSupabaseAdmin()`.** The anon key client (`createBrowserSupabase`) is for auth only on the client side.
4. **Mobile-first always.** All new UI: start at 390px, use `min-height: 44px` on all interactive elements, use `.tfc-input` / `.tfc-btn` / `.tfc-label` component classes.
5. **Dark theme by default.** Use CSS variable tokens (`var(--color-bg)`, `bg-bg`, etc.) not hardcoded hex in new components.
6. **Invite/setup code pattern.** Any future "create account via invite" flows should follow: server generates code → email code → user enters code + password → single server API call (validate + createUser + createRecord + clearCode) → client `signInWithPassword`.
7. **Atomic DB operations with rollback.** When creating records that span multiple tables, always handle partial failure (un-claim / delete) rather than leaving orphaned state.
8. **`requireTeamMember` / `requireClientAccess` on every route.** Don't forget authorization checks. Pattern: `const access = await requireTeamMember(user.email!, supabase); if (!access.ok) return access.response;`
9. **Rate limit auth-adjacent routes.** Any route that validates codes, creates users, or handles passwords must use `checkRateLimit` from `lib/rate-limit.ts`.
10. **`setup_code` characters:** use `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/I/1 to avoid ambiguity).
11. **Email templates use `@react-email/components`.** Pass to Resend as `react: ComponentFn({...props})`. Never use `@react-email/render` directly in API routes — Resend handles rendering.
12. **Supabase project ref:** `ojgaphhkajdurzkysprc`. Service role key is in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`. Never commit this file.
