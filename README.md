# BBSILOG Website

**Breanna & Bernice Silog** — Pajo, South Caloocan

> Pinaka Masarap Na Silog Sa Pajo!
>
> Trending Silog Meals Sa Pajo

Customer website for browsing meals, preparing an order for Messenger, and sharing feedback with BBSILOG.

## Features

- Mobile-friendly yellow and orange theme with the Custom Egg Eclipse design.
- Animated food videos, moving taglines, and optional music with a sound toggle.
- Menu categories and a separate menu and price list panel.
- Food packs with a separate inquiry panel.
- Guided ordering for pickup, dine-in, or delivery within the supported South Caloocan area near Pajo.
- Cash and GCash payment selections.
- Private feedback and customer-approved public reviews.
- Feedback admin dashboard with approval, archive, and restore controls.

## How ordering works

1. Select meals and available extras.
2. Review the order and quantities.
3. Enter the customer name, phone number, fulfillment details, and payment method.
4. Confirm and copy the order summary, then open Messenger to paste and send it.

The website prepares an order request. BBSILOG staff confirm availability, delivery coverage and fees, the final total, and payment instructions in Messenger. Copying the summary does not send the order automatically.

## Feedback administration

The admin page is part of the website at `/files/feedback-admin.html`. Sign in with an authorized Supabase Auth account to manage feedback.

- Feedback stays private unless the customer gives permission and an admin approves it.
- **Approved** shows featured reviews.
- **Deleted / Archived** keeps removed feedback recoverable.
- **Restore feedback** returns an entry to pending; it must be approved again before public display.
- **Messenger imports** shows owner-approved reviews transcribed from supplied screenshots. These records retain their source reference, use no invented star rating, and can be removed, archived, restored, and approved through the same dashboard. Website visitor consent remains separate from the owner's approval of an imported review.

## Website files and deployment

This folder contains the static website export, its media, and the Feedback Admin page. Upload the contents of this folder to the website repository; keep `index.html` at the repository root.

Deployment package:

```text
index.html                  # Exported customer website
files/
  feedback-admin.html       # Admin sign-in and feedback dashboard
  website-feedback.js       # Customer feedback integration
  ...                       # Referenced images, fonts, videos, and audio
README.md
vercel.json                 # Static hosting settings and response headers
```

Keep the `/files/` paths used by the exported website. Images are compressed as WebP while preserving their dimensions. A README-only repository cannot display the customer website.

### Upload to GitHub

1. Open the website repository and choose **Add file → Upload files**.
2. Drag in `index.html`, the complete `files` folder, `vercel.json`, and this `README.md` from the export folder. Upload the extracted files, not a ZIP archive or the outer `bbsilog-website` folder.
3. Commit the files to `main`.
4. Import or refresh the repository in Vercel, confirm the settings below, and deploy.

For the complete plain HTML, CSS, and JavaScript export, import [Origkfc/BBsilog-website](https://github.com/Origkfc/BBsilog-website) into Vercel with:

| Setting | Value |
| --- | --- |
| Project name | `bbsilog-website` |
| Production branch | `main` |
| Application / Framework preset | `Other` |
| Root directory | `./` when `index.html` is at the repository root |
| Build command | Empty; no build step for the static export |
| Output directory | `.` |

See [Vercel's build configuration documentation](https://vercel.com/docs/builds/configure-a-build). If Vercel cannot find a branch or commit, verify the GitHub repository has a committed `main` branch and refresh the import.

After deployment, open `/files/feedback-admin.html` on the deployed website's domain. A `localhost` link works only on the computer running the local preview server.

The customer website and admin use the existing Supabase database. They do not need separate Vercel projects. Admin access requires the existing authorized email and password; publishing the sign-in page does not grant access to private feedback. Archived reviews can be restored and then reapproved.

For email confirmations or password-recovery links, configure the final production Site URL in Supabase Auth after the deployed domain is known. The current admin page uses email/password sign-in and does not implement a password-recovery screen.

### Preview the export locally

From this folder, run `python -m http.server 8080 --bind 127.0.0.1`. Open `http://localhost:8080/` for the customer website or `http://localhost:8080/files/feedback-admin.html` for admin sign-in. Stop the server with Ctrl+C.

## Configuration and remaining content

The current feedback client and admin page use the Supabase project URL and publishable key in their JavaScript. Configure these together when changing projects, and keep the database access policies enabled. Never place secret or service-role keys, passwords, or private environment files in browser code or GitHub.

Before launch, confirm outstanding menu prices, supply the GCash QR code, and verify the complete ordering and feedback flows on a phone. Music playback may require a visitor's tap depending on browser autoplay rules.

Music defaults to enabled on each visit. If autoplay is blocked, the first tap starts it; Sound Off keeps it muted for the rest of that visit. Lyrics follow the viewport at reduced opacity and hide while a dialog or form field is active.

## Customer review imports

Eight owner-supplied Messenger reviews are featured alongside website feedback. Their original profile photos are exact, lossless crops in `files/review-avatars/`; no AI editing is used. Unknown customer names remain anonymous. These screenshots do not contain star ratings, so the imported rating remains empty.

For a fresh database with the existing feedback/admin schema installed, run `database/enable-messenger-reviews.sql`, then `database/import-messenger-reviews.sql`, then `database/enable-review-avatars.sql`. The import is idempotent and does not re-feature records an admin later removes. Owner publication approval is recorded separately from customer consent. Browser users cannot set import provenance or owner approval.

In Feedback Admin, **Messenger imports** shows the imported records; **Approved** shows featured records. Archiving removes a review from the website; restoring returns it to Pending for reapproval. `database/verify-review-moderation.sql` checks these transitions using the actual admin and anonymous roles, and rolls back all test changes.

Run focused checks with `node --test tests/review-model.test.cjs tests/music-controller.test.cjs`. Database scripts and tests are excluded from the public Vercel deployment.

## BBSILOG

- **Address:** Silanganan St., Brgy. 26, Pajo, Caloocan City
- **Hours:** Daily, 6 PM–3 AM
- **Facebook and orders:** [BBSILOG Tapsilogan](https://www.facebook.com/bbsilog.tapsilogan)
- **Messenger:** [Message BBSILOG](https://m.me/bbsilog.tapsilogan)
