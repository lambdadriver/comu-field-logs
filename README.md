# COMU Field Logs

Offline logs for communications-unit work in the field. Three tools keep an ICS 214 activity log, an ICS 309 communications log, and a T-card status board. They run in a current browser, or together in one Android app. There is no account and no project server.

**lambdadriver** publishes the current stable files below. This is an independent project. It carries no agency endorsement, and it does not replace official forms or local procedures.

## Current stable versions

| Tool | Version | File |
|---|---|---|
| ICS 214 Activity Log | 4.18 | [apps/ICS_214_Activity_Log_v4.18.html](apps/ICS_214_Activity_Log_v4.18.html) |
| ICS 309 Communications Log | 1.5 | [apps/ICS_309_Communications_Log_v1.5.html](apps/ICS_309_Communications_Log_v1.5.html) |
| T-Card Printer & Tracker | 1.2 | [apps/TCard_Printer_Tracker_v1.2.html](apps/TCard_Printer_Tracker_v1.2.html) |
| COMU Field Logs for Android | 1.1 (versionCode 2) | [downloads/COMU_Field_Logs_v1.1-public.apk](downloads/COMU_Field_Logs_v1.1-public.apk) |

The Android app packages those same three HTML files, byte for byte, plus a small offline shell. It installs on Android 7.0 or newer (minSdk 24).

A GitHub Release has not been published. The links above are the downloads. They point at files in this repository, so they keep working after this branch is merged.

## Download on GitHub

Each link opens the file page. The highlighted code view is for reading. To keep the exact file, use the **Download** button on that page (the down arrow, labeled “Download raw file”). Copying text out of the code view can change the file.

### Android app

1. Open [COMU_Field_Logs_v1.1-public.apk](downloads/COMU_Field_Logs_v1.1-public.apk) (181,819 bytes).
2. On the file page, click **Download**.
3. Copy the APK to the phone if you downloaded it on a computer.
4. Open the APK on the phone. If Android asks, allow installation from that source, then tap Install.
5. Play Protect may describe the developer as unknown. The app is signed with a self-signed certificate, `CN=lambdadriver`, and it is not distributed through the Play Store.
6. Compare the file with the SHA-256 in [Checksums](#checksums) before you install.

### Browser tools

1. Open one HTML link from the table above.
2. Download the raw file. Leave the highlighted code view as-is.
3. Open the saved `.html` file in a browser, by double-clicking it or by using File → Open. A web server is not required.
4. After the file is on the device, it opens with the network disconnected.

## Getting started

**Android.** The home screen lists ICS 214, ICS 309, and T-Card. Open a tool, fill in the incident header, and add records. Print opens the system print dialog, including Save as PDF. CSV and JSON exports are saved under `Downloads/COMU Field Logs/`.

**Browser.** Open the HTML file and use the same screens. Print opens the browser print dialog. Exports download through the browser.

My Info and the display theme (bright, dark, night red, or night green) stay on that device. The Android app and a browser copy keep separate data until you export from one and import into the other.

Field mode keeps the screen awake while you are logging.

## Offline use, privacy, and backup

- Each page is a single file. Its content security policy blocks network connections. The Android manifest declares no internet permission.
- A browser copy stores logs in local storage for the file you opened. The Android app stores logs in the app’s private storage.
- The apps include no account, no in-app encryption, and no PIN.
- The Android manifest sets `android:allowBackup="true"`. When the phone’s own Android backup is turned on, the operating system can include the app’s private storage in that device backup.
- **Export JSON** is the backup you can open and move. Make one on a regular schedule. Uninstalling the app, or clearing the browser’s stored data, deletes the logs kept there.
- **Import JSON** restores a backup or moves it to another device. Import replaces the log that is already open. It does not merge the two.
- Open each exported JSON file and confirm the records are in it before you delete a copy of the app or clear browser data.
- CSV export is the spreadsheet copy.
- The ICS 214 About screen tells iPhone users that Safari may clear data after about seven days unused, and that a home-screen copy of the page keeps its own storage.
- Some browsers block storage for a file opened from a folder, or in a private window. If the page says storage is blocked, the log will not remain after you close it. Use a normal browser window, or the Android app, when the log has to stay on the device.

### Moving from an older privately shared Android build

This public APK uses a new signing certificate. Android refuses to install it as an update over a copy signed with the older key.

To keep logs, do this on your own phone:

1. In the old app, open ICS 214, ICS 309, and T-Card.
2. In each tool, choose **Export JSON**.
3. Open every file and confirm the records are there. Put a copy somewhere safe, such as another folder or another device.
4. After those files check out, uninstall the old app, install this public APK, and choose **Import JSON** in each tool.

This repository does not uninstall anything. Uninstall the older copy only after the backup files have been checked.

## Permissions (Android)

- Location is optional. GPS tagging stays off until you turn it on in ICS 214 or ICS 309. The app asks for location the first time you use it. T-Card does not use location. The install does not require a GPS radio (`android.hardware.location` is optional).
- Storage is requested only on Android 9 and older (`WRITE_EXTERNAL_STORAGE`, maxSdkVersion 28).
- The manifest has no internet permission.

GPS tagging is marked beta in the pages. Phones often refuse location for a page opened as a local file.

## Checksums

From a clone of this repository, in the repository root:

```bash
sha256sum -c downloads/SHA256SUMS.txt
```

On macOS the matching command is `shasum -a 256 -c downloads/SHA256SUMS.txt`. On Windows, run `certutil -hashfile <file> SHA256` and compare it with the table.

| File | Bytes | SHA-256 |
|---|---:|---|
| [downloads/COMU_Field_Logs_v1.1-public.apk](downloads/COMU_Field_Logs_v1.1-public.apk) | 181819 | `c5f9e88c5f68d9ac250aa2ac23968184ccf5420de1dd5006ede4920a85278234` |
| [apps/ICS_214_Activity_Log_v4.18.html](apps/ICS_214_Activity_Log_v4.18.html) | 108364 | `6135fcc8351732486599d765074abd322721978f731f8a75cdef4a9020e3f13d` |
| [apps/ICS_309_Communications_Log_v1.5.html](apps/ICS_309_Communications_Log_v1.5.html) | 131397 | `220671f1595ebe674c33d5084468549b4974c19549fb3c796eb6a855554d5ff1` |
| [apps/TCard_Printer_Tracker_v1.2.html](apps/TCard_Printer_Tracker_v1.2.html) | 105583 | `24c7b4c9980bfc4acdb2daee40b54949b0324b9fd25f8253e358215178b9dcac` |

The full list is also in [downloads/SHA256SUMS.txt](downloads/SHA256SUMS.txt).

APK signing certificate: subject `CN=lambdadriver`, SHA-256 `0258e94dfcf0c8dcc041f9c2683caf2e0be1d78e4c2067787985cee4cd926abc`. The certificate is self-signed. A later public build can replace this one on a phone only when it is signed with this same certificate.

## Limits

The notes below are practical limits. They are not a certification. The test record is in [docs/VALIDATION.md](docs/VALIDATION.md). Version history is in [docs/CHANGELOG.md](docs/CHANGELOG.md).

- The tools are for one person on one device. They have no multi-user mode and no sync.
- Import replaces the current log.
- There is no encryption, PIN, or automatic in-app backup.
- GPS tagging is beta.
- This exact public APK has not been installed on a physical phone in the recorded checks. An earlier private build was reported to work on a phone. That report describes a different file.
- Recorded browser checks for this build: app-page checks 26 of 26, import-escaping and print security checks 40 of 40, and T-Card checks 70 of 70. One T-Card print comparison failed on a first run and passed on the rerun. The separate ICS 214 and ICS 309 browser suites were not run on this build.

## License

Copyright 2026 lambdadriver. Download and use of the apps is permitted. Modification and redistribution stay with the copyright holder unless they are granted separately. The full terms are in [LICENSE](LICENSE). Those terms are not an open-source license.

## Repository layout

- `apps/` holds the three browser tools.
- `downloads/` holds the Android APK and [downloads/SHA256SUMS.txt](downloads/SHA256SUMS.txt).
- `docs/` holds the changelog, the validation record, and a maintainer draft for a future GitHub Release.
