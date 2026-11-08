# Validation

These are checks against the release files. They are the developer’s own tests plus a packaging re-check. They are not a certification, and they have no agency approval.

## v1.1 public build (November 7, 2026)

Checked on the exact release files whose SHA-256 values are listed in the README.

**Passed**

- Package checks: `app.comufieldlogs`, versionName 1.1, versionCode 2, minSdk 24, targetSdk 36. Permissions are unchanged: location, plus storage only on Android 9 and older. There is no internet permission.
- APK signature verifies with schemes v2 and v3, certificate `CN=lambdadriver`. The APK passes 4-byte zip alignment.
- The app code, manifest, and resources are byte-identical to the v1.1 private build. Only the four web pages changed (credit and comment text).
- The pages bundled in the app are byte-identical to the standalone HTML release files.
- The release files contain no personal names, contact details, or internal paths.
- Phone-size headless browser checks of the bundled pages passed 26 of 26: navigation, Back, shared My Info and theme, print and export hand-off, field mode, night mode, and no network requests.
- The import-escaping and print security suite passed 40 of 40 checks.
- The T-Card browser suite passed 70 of 70 checks. One print-rendering comparison failed on the first run and passed on a re-run.

**Not run on this build:** the other ICS 214 and ICS 309 browser suites, and any Android device or emulator.

**User-reported:** an earlier private APK build was reported to work well on a real phone. That is not the same signed file as this release.

**Not yet verified on a physical phone for this build:** installation, printing, saving exports to Downloads, GPS tagging, and JSON import.

## Packaging re-check (November 8, 2026)

Repeated against the files committed under `apps/` and `downloads/`. The APK and the three HTML files were copied byte for byte. They were not rebuilt.

**Passed here**

- SHA-256 of the APK is `c5f9e88c5f68d9ac250aa2ac23968184ccf5420de1dd5006ede4920a85278234`.
- SHA-256 of ICS 214 v4.18 is `6135fcc8351732486599d765074abd322721978f731f8a75cdef4a9020e3f13d`.
- SHA-256 of ICS 309 v1.5 is `220671f1595ebe674c33d5084468549b4974c19549fb3c796eb6a855554d5ff1`.
- SHA-256 of T-Card v1.2 is `24c7b4c9980bfc4acdb2daee40b54949b0324b9fd25f8253e358215178b9dcac`.
- `assets/www/214/index.html`, `assets/www/309/index.html`, and `assets/www/tcard/index.html` inside the APK match those three HTML files byte for byte. Page versions in the files are 4.18, 1.5, and 1.2.
- Android `apksig` 9.5.1 `ApkVerifier` (the verifier used by `apksigner`) reports the APK verified, scheme v2 true, scheme v3 true, schemes v1, v3.1, and v4 false, with no errors and no warnings. Certificate subject `CN=lambdadriver`. Certificate SHA-256 `0258e94dfcf0c8dcc041f9c2683caf2e0be1d78e4c2067787985cee4cd926abc`.
- Every stored ZIP entry is 4-byte aligned (21 entries, none misaligned). That is the `zipalign -c 4` condition. The `zipalign` binary was not installed in this environment; the offsets were checked directly.
- Decoded `AndroidManifest.xml`: package `app.comufieldlogs`, versionName `1.1`, versionCode `2`, minSdkVersion `24`, targetSdkVersion `36`. Permissions are `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, and `WRITE_EXTERNAL_STORAGE` with maxSdkVersion 28. Location hardware features are present and not required. No internet permission is declared. `android:allowBackup` is true.
- ICS 214 and ICS 309 both include optional GPS tagging, off unless the checkbox is enabled. T-Card v1.2 has no geolocation control.
- A scan of the three HTML files, the APK shell page, and `classes.dex` strings found no email addresses, no private-key blocks, no cloud-storage URLs, and no third-party license notices. `classes.dex` references Android framework classes only. No third-party notice was removed.

**Also run here, and not a substitute for the suites above**

- `jarsigner -verify` reported “jar verified” and warned that the signer certificate is self-signed. That warning is expected for this certificate.
- The three HTML files were opened in headless Chrome from `file://` URLs. Each page showed its title and in-page version (ICS 214 Activity Log 4.18, ICS 309 Communications Log 1.5, T-Card Printer & Tracker 1.2). One activity, one message, and one T-card were added. Each record was still present after reload, and Export JSON wrote a backup containing that record. The pages made no network requests. This was not the 26/26, 40/40, or 70/70 suite, and those suites were not re-run here.
- No phone or emulator install was performed.

## Known limits

- No multi-user use or sync. Import replaces the current log.
- No encryption, PIN, or automatic in-app backup. Android device backup can still include app data because `allowBackup` is true.
- GPS tagging is beta.
- This public APK is unsigned by any app-store identity. Play Protect may warn before installation.
