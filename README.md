# BBsilog-website
BBSILOG Website

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

## Website files and deployment

This README documents the website. It does not contain the complete deployable website. The current preview must be exported and uploaded with its supporting files before deployment.

The deployment package needs this layout:

```text
index.html                  # Exported customer website
files/
  feedback-admin.html       # Admin sign-in and feedback dashboard
  website-feedback.js       # Customer feedback integration
  ...                       # Referenced images, fonts, videos, and audio
README.md
```

Keep the `/files/` paths used by the exported website. A README-only repository cannot display the customer website.

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

## Configuration and remaining content

The current feedback client and admin page use the Supabase project URL and publishable key in their JavaScript. Configure these together when changing projects, and keep the database access policies enabled. Never place secret or service-role keys, passwords, or private environment files in browser code or GitHub.

Before launch, confirm outstanding menu prices, supply the GCash QR code, and verify the complete ordering and feedback flows on a phone. Music playback may require a visitor's tap depending on browser autoplay rules.

## BBSILOG

- **Address:** Silanganan St., Brgy. 26, Pajo, Caloocan City
- **Hours:** Daily, 6 PM–3 AM
- **Facebook and orders:** [BBSILOG Tapsilogan](https://www.facebook.com/bbsilog.tapsilogan)
- **Messenger:** [Message BBSILOG](https://m.me/bbsilog.tapsilogan)

