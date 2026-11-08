# Changelog

Public version history for the files in this repository. Earlier standalone HTML releases existed (ICS 214 v4.16, ICS 309 v1.3, T-Card v1.0). Notes for those versions were not kept in a form that can be checked, so they are omitted.

## v1.1 public build — November 7, 2026

First public release. Same features and app code as the private v1.1 build, with these differences:

- Author credit in the app, About screens, and file metadata reads **lambdadriver**.
- Signed with a new public signing key (`CN=lambdadriver`). Android will not install it over a privately shared copy signed with the previous key. Export JSON from each tool, and open the files, before switching.
- Internal build-path comments were removed from the bundled pages.

The Android package is `app.comufieldlogs`, versionName 1.1, versionCode 2. It bundles ICS 214 v4.18, ICS 309 v1.5, and T-Card v1.2. Those pages match the HTML files in `apps/`.

## v1.1 — October 31, 2026 (private build)

The Android app (versionCode 2) bundles ICS 214 v4.18, ICS 309 v1.5, and T-Card v1.2.

- **Security:** imported text is escaped in all three tools, so a crafted backup is shown as plain text and is not executed as script.
- **ICS 214 printing:** for logs with about 39 or more resources, the first activity entry moves to the continuation page instead of being hidden.

## v1.0 — October 31, 2026

First Android app. It bundles ICS 214 v4.17, ICS 309 v1.4, and T-Card v1.1, with shared My Info, shared themes (bright, dark, night red, or night green), Android printing, CSV and JSON export, and a field mode that keeps the screen on.

## Repository

November 8, 2026: the empty repository had been created with the GNU GPL v3.0 license text. No application files were in that commit. That license file is replaced by the copyright and use terms in `LICENSE` before the applications are added. The applications are offered under those terms only.
