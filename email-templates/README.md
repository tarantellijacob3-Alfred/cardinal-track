# TrackRoster Email Templates

Professional, branded email templates for Supabase authentication flows.

## Overview

These templates are designed for the TrackRoster track & field team management platform. They maintain a consistent "coach-friendly" tone—professional but approachable, like receiving an email from your coach rather than a faceless corporation.

## Design Specifications

**Brand Colors:**
- Navy (`#1e3a5f`) - Primary brand color, used in header and headings
- Gold (`#c5a900`) - Accent color, used for CTAs and links
- White (`#ffffff`) - Background
- Light gray (`#f5f5f5`) - Page background
- Light gold (`#fff8e1`) - Info box backgrounds

**Typography:**
- System font stack for maximum email client compatibility
- Font sizes: 24px (headings), 16px (body), 14px (small text)
- Clear hierarchy with generous line spacing (1.6)

**Layout:**
- Maximum width: 600px (optimal for desktop and mobile)
- Responsive tables for email client compatibility
- Rounded corners (8px) for modern feel
- Consistent padding and spacing throughout
- Mobile-friendly design (all coaches check email on phones)

**Components:**
- Logo header with navy background
- Prominent gold CTA button
- Fallback text link for accessibility
- Light gold info boxes for important notes
- Clean footer with tagline

## Templates

### 1. Confirm Sign Up (`confirm-signup.html`)
**Purpose:** Email verification after user registration

**Supabase Variables:**
- `{{ .ConfirmationURL }}` - Link to verify email address
- `{{ .SiteURL }}` - Base URL of your application (available but not used in this template)

**User Journey:** New user signs up → receives this email → clicks button → account activated

**Key Features:**
- Welcoming tone ("Welcome to TrackRoster!")
- Clear explanation of what verification does
- Fallback instruction if button doesn't work

---

### 2. Invite User (`invite-user.html`)
**Purpose:** Inviting someone who doesn't have an account yet

**Supabase Variables:**
- `{{ .ConfirmationURL }}` - Link to accept invitation and create account
- `{{ .SiteURL }}` - Base URL of your application (available but not used)

**User Journey:** Admin invites coach/athlete → recipient receives this email → clicks button → sets up account

**Key Features:**
- Emphasizes they've been invited to join
- Brief explanation of what TrackRoster is
- "Accept Invitation" CTA

---

### 3. Magic Link (`magic-link.html`)
**Purpose:** Passwordless sign-in via one-time link

**Supabase Variables:**
- `{{ .ConfirmationURL }}` - One-time sign-in link
- `{{ .Token }}` - Available if needed for manual token entry
- `{{ .SiteURL }}` - Base URL (available but not used)

**User Journey:** User requests magic link → receives this email → clicks button → signed in instantly

**Key Features:**
- Clear "Sign In Now" action
- Security note about 1-hour expiration and single-use
- Yellow info box draws attention to security details

---

### 4. Change Email Address (`change-email.html`)
**Purpose:** Verify new email when user changes their account email

**Supabase Variables:**
- `{{ .ConfirmationURL }}` - Link to confirm new email address

**User Journey:** User changes email in settings → receives this email at NEW address → confirms → email updated

**Key Features:**
- Explains that old email will no longer work
- Important notice box highlighting the change
- Security reminder to contact admin if unauthorized

---

### 5. Reset Password (`reset-password.html`)
**Purpose:** Password reset request

**Supabase Variables:**
- `{{ .ConfirmationURL }}` - Link to password reset form

**User Journey:** User clicks "Forgot Password" → receives this email → clicks button → creates new password

**Key Features:**
- Clear "Reset Password" heading
- Security note about 1-hour expiration
- Warning that all devices will be signed out
- Reassurance if request wasn't made

---

### 6. Reauthentication (`reauthentication.html`)
**Purpose:** Verify identity before sensitive actions

**Supabase Variables:**
- `{{ .ConfirmationURL }}` - Link to re-verify identity

**User Journey:** User attempts sensitive action (e.g., change billing) → receives this email → verifies → completes action

**Key Features:**
- Explains why reauthentication is needed
- Info box clarifying when this is triggered
- Security emphasis ("verify your identity")
- Urgent tone if action wasn't initiated

---

## Implementation

### How to Use These Templates

1. **Go to Supabase Dashboard:**
   - Navigate to: https://supabase.com/dashboard/project/wusgkllzmopflpuizanr/auth/templates

2. **For Each Template:**
   - Select the template type (Confirm signup, Invite user, etc.)
   - Copy the entire HTML content from the corresponding file
   - Paste into the Supabase email template editor
   - Click "Save"

3. **SMTP Configuration:**
   - Already configured to use Resend SMTP
   - Sender: `noreply@mytrackroster.com`
   - Sender name: `TrackRoster`

4. **Testing:**
   - Test each flow in development before production deployment
   - Check rendering in multiple email clients (Gmail, Outlook, Apple Mail)
   - Verify on mobile devices (most coaches use mobile email)

### Template Variables Reference

Supabase provides these variables for use in email templates:

- `{{ .ConfirmationURL }}` - The main action link (most common)
- `{{ .Token }}` - Verification token (if manual entry needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your application's base URL
- `{{ .Email }}` - Recipient's email address (available but not used for privacy)

**Note:** These templates use `{{ .ConfirmationURL }}` as the primary action link. The URL structure is handled automatically by Supabase based on your auth configuration.

## Design Rationale

**Why "Coach-Friendly"?**
The primary users are track coaches—they're busy, practical people who value clear communication. The tone is:
- Direct and action-oriented
- Friendly but not overly casual
- Professional without being corporate
- Reassuring around security matters

**Why These Colors?**
- Navy conveys trust, professionalism, authority
- Gold adds warmth, achievement, tradition (track medals!)
- Together they feel athletic and established

**Why System Fonts?**
Email clients have inconsistent custom font support. System fonts ensure:
- Reliable rendering across all email clients
- Fast load times (no web font downloads)
- Clean, modern appearance everywhere

**Why Tables?**
HTML email rendering is stuck in the past. Table-based layouts are the most reliable way to ensure consistent appearance across:
- Gmail (web, iOS, Android)
- Outlook (all versions)
- Apple Mail
- Mobile email clients
- Dark mode (no background color issues)

## Maintenance

**Logo Updates:**
- Logo is loaded from: `https://mytrackroster.com/trackroster-logo.svg`
- Update the logo file at that URL, and all templates update automatically

**Color Changes:**
- Search and replace hex codes across all templates
- Navy: `#1e3a5f`
- Gold: `#c5a900`

**Content Updates:**
- Edit HTML files directly
- Keep Supabase variables intact (anything with `{{ }}`)
- Test in multiple email clients after changes

## Accessibility

All templates include:
- Semantic HTML structure
- Sufficient color contrast (WCAG AA compliant)
- Fallback text links for users who can't click buttons
- Alt text for logo image
- Clear, readable font sizes
- Mobile-responsive design

## Support

For questions about these templates, contact the TrackRoster development team or refer to:
- Supabase Auth Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Email HTML Best Practices: https://www.campaignmonitor.com/css/

---

**Files in this directory:**
- `confirm-signup.html` - Email verification after registration
- `invite-user.html` - Team invitation email
- `magic-link.html` - Passwordless sign-in link
- `change-email.html` - New email verification
- `reset-password.html` - Password reset link
- `reauthentication.html` - Identity verification for sensitive actions
- `README.md` - This documentation file

**Created:** January 2025  
**Platform:** Supabase Auth + Resend SMTP  
**Brand:** TrackRoster (mytrackroster.com)
