# Draft GitHub Release notes — not published

No GitHub Release exists for this project. This file is a paste-ready draft for the maintainer. Publishing a Release, changing repository visibility, and merging the pull request are separate steps the maintainer does in the GitHub website. Nothing in this repository publishes them automatically.

## Suggested Release title

COMU Field Logs 1.1

## Suggested tag

`v1.1` on `main`, created only after the release branch is merged and the files below are the ones you mean to publish.

## Notes to paste

COMU Field Logs 1.1 is the first public build of the offline ICS 214, ICS 309, and T-card tools.

The Android app is `app.comufieldlogs`, versionName 1.1, versionCode 2, signed by `CN=lambdadriver`. It bundles the same pages as the browser files:

- ICS 214 Activity Log 4.18
- ICS 309 Communications Log 1.5
- T-Card Printer & Tracker 1.2

The browser files live in the repository under `apps/`. The Android package attached to this Release is the file `downloads/COMU_Field_Logs_v1.1-public.apk` from the repository. Its SHA-256 is `c5f9e88c5f68d9ac250aa2ac23968184ccf5420de1dd5006ede4920a85278234`. The signing certificate SHA-256 is `0258e94dfcf0c8dcc041f9c2683caf2e0be1d78e4c2067787985cee4cd926abc`.

This build uses a new signing key. Android will not install it over an older privately shared copy. In the old app, export JSON from ICS 214, ICS 309, and T-Card, open those files, and only then uninstall the old app and import the backups.

Copyright 2026 lambdadriver. Licensed under the GNU GPL version 3. The license text is `LICENSE` in the repository.

This is an independent project. It has no agency endorsement and it is not a certification. This exact APK has not been installed on a physical phone in the recorded checks.

`docs/SOURCE.md` records the check of the Android corresponding source against this APK. Upload this existing APK. Do not replace it with a from-source build. A from-source build signed with another key will not match this file.

## Maintainer: upload the APK from the GitHub website

The release tooling used to prepare the branch cannot create a GitHub Release. After the Android source is in the tree, the pull request is merged, and you want a Release:

1. Keep the repository private until `docs/SOURCE.md` says the Android corresponding source is present and checked. Visibility is then Settings → General → Change repository visibility. This draft does not change visibility.
2. Open the repository on GitHub, then **Releases**, then **Draft a new release**.
3. Choose the tag `v1.1` and create it from `main` after the merge. Set the title to `COMU Field Logs 1.1`.
4. Paste the notes above.
5. Under release assets, upload `downloads/COMU_Field_Logs_v1.1-public.apk` from the merged tree. Upload that file as-is. Do not rebuild it and do not sign it again.
6. Optional: attach the three HTML files from `apps/` as well. Visitors can already download them from the repository.
7. Compare the uploaded APK with SHA-256 `c5f9e88c5f68d9ac250aa2ac23968184ccf5420de1dd5006ede4920a85278234` before you publish.
8. Publish the Release only after that source check. Upload the existing APK. Do not substitute a rebuild. A Release in a private repository stays private.

`main` is the stable branch. This pull request targets `main`. After it is merged, GitHub’s license badge is taken from `LICENSE` on `main`, which is the canonical GPL-3.0 text. The applications are not on `main` until that merge.
