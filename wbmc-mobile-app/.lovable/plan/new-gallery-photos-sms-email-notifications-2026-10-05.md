# New Gallery Photos: SMS + Email Notifications

## Important limitation (email)
Emailing every app user about new photos counts as a bulk announcement. The app's built-in email sending only allows one-to-one emails (receipts, confirmations), so it **can't** send these. Bulk emails from the same sender also hurt delivery of sign-in emails.

**Email option instead:** HubSpot is already connected and all users are already synced there. When a gallery slide is approved, the app adds the contact property `last_gallery_update` in HubSpot, and you set up a HubSpot marketing email/workflow that triggers on it. HubSpot handles unsubscribes and sending.

## What will be built

1. **When it triggers** – only when a gallery slide becomes "approved" (admin adds one, or approves a pending one). Pending uploads send nothing.
2. **SMS via Twilio** – a short text to every user who has a phone number and has opted in:
   "New photos on Echo: <slide title>. View: <app link>. Reply STOP to opt out."
3. **Opt-in / opt-out** – a new "Gallery notifications (SMS)" switch in Settings > Personal. Off by default (required for consent, and keeps Twilio costs down). Replying STOP is handled by Twilio automatically.
4. **Admin control** – a "Notify users" checkbox on the Add Gallery Slide form (on by default), so admins can skip notifying for small edits.
5. **Email via HubSpot** – update each opted-in contact in HubSpot so your HubSpot workflow sends the email.
6. **Phone formatting** – numbers like 082... are converted to +2782... ; invalid numbers are skipped.

## What you'll need to provide
- Connect your Twilio account (a connect card will appear) and a Twilio sending number.
- In Twilio, turn on SMS Pumping Protection and limit Geo Permissions to South Africa.
- In HubSpot, create the email and workflow (I'll give you the exact steps).

## Technical details
- Migration: `profiles.sms_gallery_opt_in boolean default false`, `profiles.email_gallery_opt_in boolean default false`; `gallery_notifications` log table (slide_id unique, sent_at, sms_count) to prevent double sends; GRANTs + admin-only RLS.
- Edge function `notify-gallery-upload`: verifies caller is admin, checks log for slide_id, loads opted-in profiles via service role, sends Twilio SMS through the connector gateway in batches with small delays, PATCHes HubSpot contacts (`last_gallery_update`, `last_gallery_title`), writes the log.
- Called from `useAddGallerySlide` (when status approved and notify checked) and from ContentApprovalTab on gallery approval.
- Twilio sender number stored as secret `TWILIO_FROM_NUMBER`.
