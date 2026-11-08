# Corresponding source and build

Status: **checked**. The Android sources are in this repository. A build with Android SDK platform 36, build-tools 36.0.0, and the JDK on this machine produced unsigned contents that match the published APK. The published APK file itself was not modified.

The three HTML files in `apps/` are the browser-tool source. They are also the pages under `web/assets-www/`, except the launcher page, which exists only as `web/assets-www/index.html`.

## What the APK contains

Inspected from `downloads/COMU_Field_Logs_v1.1-public.apk` (SHA-256 `c5f9e88c5f68d9ac250aa2ac23968184ccf5420de1dd5006ede4920a85278234`). The file was not modified.

| Item | In the APK | In this repository |
|---|---|---|
| `assets/www/214/index.html` | SHA-256 `6135fcc8351732486599d765074abd322721978f731f8a75cdef4a9020e3f13d` | `apps/ICS_214_Activity_Log_v4.18.html`, same bytes |
| `assets/www/309/index.html` | SHA-256 `220671f1595ebe674c33d5084468549b4974c19549fb3c796eb6a855554d5ff1` | `apps/ICS_309_Communications_Log_v1.5.html`, same bytes |
| `assets/www/tcard/index.html` | SHA-256 `24c7b4c9980bfc4acdb2daee40b54949b0324b9fd25f8253e358215178b9dcac` | `apps/TCard_Printer_Tracker_v1.2.html`, same bytes |
| `assets/www/index.html` | 37,399 bytes, SHA-256 `8b6b6e27a8c85d64f9e06108e2435687d191a9f45c84b6de29a431e3c2642790` | Not present as its own file |
| `classes.dex` | 17,584 bytes, SHA-256 `33734f5416d822d843979181f7d748b71d50318f2b36b8c9ebe721dcf48e316f` | No Java sources |
| `AndroidManifest.xml` | Compiled manifest | No manifest source |
| `resources.arsc` and `res/mipmap-*` | Compiled resources and launcher icons | No resource sources |
| `META-INF/LAMBDADR.*` | Signature | Private key is not in the repository and must not be added |

Decoded manifest values: package `app.comufieldlogs`, versionName `1.1`, versionCode `2`, minSdk 24, targetSdk 36, compileSdk 36. Permissions are fine location, coarse location, and `WRITE_EXTERNAL_STORAGE` with maxSdk 28. Location hardware is optional. There is no internet permission. `android:allowBackup` is true.

`classes.dex` names `MainActivity.java` and the generated `R.java`. The app classes are `app.comufieldlogs.MainActivity` and its inner classes `Bridge`, `Chrome`, and `LocalClient`, plus anonymous classes of `MainActivity` and `Bridge`. Resource classes are `R.color`, `R.mipmap`, `R.string`, and `R.style`. There are no `androidx` or Kotlin references in the dex strings. There is no `.so` library and no extra jar. The build does not use Gradle. `scripts/build_apk.py` calls `aapt2`, `javac`, and `d8` directly.

## What was checked

On this machine, `python3 scripts/build_apk.py --sdk <sdk>` with build-tools 36.0.0 and platform android-36 compiled `android/` and packed `web/assets-www/`. These 18 entries matched the published APK byte for byte: `classes.dex`, `AndroidManifest.xml`, `resources.arsc`, every `res/` file, and every `assets/www/` file. The unsigned APK has no `META-INF` signature. The published APK does. That difference is the signature, not the program.

The Java comment in `MainActivity.java` credits lambdadriver and names GPL-3.0. It is four lines, the same length as the comment it replaced, so the line numbers in the class file stay put and `classes.dex` still matches. The HTML files were not edited.

Some PNG files in `android/res/` are not byte-identical to the PNGs stored in the APK. `aapt2` rewrites them. The PNGs inside the built APK match the published APK. `art/icon.py` draws the same radio, and it is not proven to reproduce the resource PNGs or their metadata exactly. `reference/comu-shared/` is not a generator for the public HTML.

No third-party license notice was found in the HTML, the manifest strings, or `classes.dex`. The code references Android framework classes only. The Android SDK used to compile is a build tool under the Apache License 2.0 from the Android Open Source Project. That license is not the license for COMU Field Logs, and this repository does not vendor the SDK.

## Signing

The published APK stays the file signed with certificate `CN=lambdadriver`, SHA-256 `0258e94dfcf0c8dcc041f9c2683caf2e0be1d78e4c2067787985cee4cd926abc`. Do not replace that file with a rebuild. Do not add the private key to the repository.

A from-source build uses a new key created on the builder’s machine. Example, run locally and do not commit the keystore (`.gitignore` already ignores `*.jks`):

```bash
keytool -genkeypair -v -keystore local-release.jks -alias comufieldlogs \
  -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=local-build"
```

An APK signed with that key is a different Android app identity from the published file. It will not install over the published APK, and its bytes will not match the checksum above. This repository does not claim that a from-source build reproduces `COMU_Field_Logs_v1.1-public.apk`.

The command that was run here is:

```bash
python3 scripts/build_apk.py --sdk "$ANDROID_SDK_ROOT"
```

JDK on this machine was 21.0.12.1. `javac` was invoked as `-source 8 -target 8`. `d8` was `--release --min-api 24`. `zipalign` was `-f 4`. The unsigned entry bytes still matched the published APK. A later build on another JDK patch can change `classes.dex` if the class-file line tables change. Compare the entries listed above before treating a new build as the same binary.

## In-app license notice

Not applied. The current About screens credit lambdadriver and do not show a warranty statement, a GPL conveyance statement, or a way to view the license. GPL-3.0 section 5(d) therefore does not require those interfaces to start showing Appropriate Legal Notices.

The Free Software Foundation’s “How to Apply These Terms” section, which is included at the end of `LICENSE`, recommends a notice in each source file. Adding it to the HTML, or to the APK, changes the release hashes. A new APK would then have to be signed locally with the approved `CN=lambdadriver` key. That rebuild has not been made. The files now in `apps/` and `downloads/` are not that rebuild.

Suggested text, for a later source change only:

```
Copyright 2026 lambdadriver
This program is free software under the GNU General Public License, version 3.
There is no warranty. See the LICENSE file for the full terms.
```
