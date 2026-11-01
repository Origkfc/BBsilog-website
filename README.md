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

- **Address:** Silanganan St. corner Purification St., Brgy. 26, Maypajo, Caloocan City
- **Hours:** Daily, 6 PM–2 AM
- **Facebook and orders:** [BBSILOG Tapsilogan](https://www.facebook.com/bbsilog.tapsilogan)
- **Messenger:** [Message BBSILOG](https://m.me/bbsilog.tapsilogan)

### Feedback pitcher rewards

Regular orders use the copy-summary-to-Messenger checkout. Order QR codes and percentage discounts are retired. Feedback with a name, mobile number and photo can receive a single-use free iced tea pitcher QR for the next dine-in visit. One reward per normalized mobile number; staff check the photo and feedback before redemption. Phone numbers are not SMS-verified. Public name/review consent and photo consent remain separate from reward eligibility.

Use the existing admin at `/files/feedback-admin.html`: Feedback, Free iced tea pitchers and Scan reward QR. Approving a review does not override photo consent. Historical order migrations remain in `database/` for audit only.

### Menu and contact update — November 1, 2026

The customer menu is maintained in `files/menu-catalog.js`. Smoothies have separately priced 16 oz and 22 oz variants. Seven standard food packs display their per-pack prices; the minimum food-pack order is 20 packs. Custom combinations require a quote. Food packs remain outside the regular order cart.

Contact: 0947 760 3051, displayed in Our Story with a WhatsApp link. Menu illustrations are stored in `files/menu-images/`; their prompts are documented in `tests/menu-image-prompts.md`. The latest Garlic Pepper Beef and Chicken Ala King photos are based on the owner’s actual dishes.


### Additional meals and serving photos — November 1, 2026

Added six silog meals, B1 single burger steak, and five sizzling meals at the prices supplied by the owner. Bacsilog now belongs to Silog meals. The existing Special Chicken Silog and Sizzling Ala Max Chicken remain separate from the newly added Chicken Silog and Sizzling Chicken.

Opening hours are 6 PM–2 AM daily. Extras now use food photos instead of emoji icons. S3 includes plain rice in its description and illustration.


### Delivery map estimate — November 1, 2026

Delivery checkout adds a location step after customer details. Customers tap or drag a destination pin, see the distance and fee, then acknowledge the pin before confirming. Pickup skips the map. Changing the address clears its previous pin; changing the order invalidates a copied summary. The Messenger text includes the selected Google Maps pin link, proximity distance, estimated fee and food-plus-delivery total. Staff still verify South Caloocan coverage and the final total; pins alone do not establish address eligibility.

Rates use **straight-line map proximity**, not road/driving distance, from BBSILOG (14.6418488, 120.9749312): up to 0.5 km ₱20; over 0.5–1 km ₱40; over 1–1.5 km ₱60; over 1.5–2.5 km ₱80. Beyond 2.5 km requires pickup. The checked Google Maps driving route to SM Grand Central Parking was about 2.5 km; the exact rear entrance and route can vary.

Leaflet 1.9.4 is bundled with its license and loaded only when the delivery map opens. OpenStreetMap tiles use normal browser caching, visible attribution and no bulk prefetch. Tile service is best effort; Retry map is available. The optional location button requests device permission only when tapped. No destination is saved server-side by the map; the customer shares its pin with staff when sending the Messenger order. A map pin is a customer-supplied estimate, not payment or fulfillment verification.

`window.BBSILOG_MAP_TILE_URL` may override the tile URL if the tile service changes. Review the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before changing caching or map traffic behavior.

Focused checks: `node tests/delivery-fees.test.cjs` and `node tests/delivery-map-browser.cjs` (set `PLAYWRIGHT_MODULE` if needed). Browser tests use fixture tiles to avoid unnecessary public map traffic.

Follow BBSILOG updates now live in the footer. Limited Edition cards animate once on first scroll into view; reduced-motion visitors get no reveal animation. The approved groupie photo for feedback record 32 was enabled after the owner confirmed customer permission; no other photo permissions were changed.
