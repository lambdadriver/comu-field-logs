# T-Card Tracker v1.2-exp.2 (experimental)

This is an experimental side branch of the mainline T-Card v1.2 page. It is not part of the Android app, and it is not a replacement for `apps/TCard_Printer_Tracker_v1.2.html`.

Copyright 2026 lambdadriver. The page is licensed under the GNU General Public License, version 3, the same license as the rest of this repository. The text is `LICENSE` at the repository root. There is no warranty.

## Do not mix it with the stable tool

- Open `TCard_Tracker_v1.2-exp.2.html` on its own. It is not bundled in the APK.
- Its saved data uses `tcard.exp1.v1` and `tcard.exp1.myinfo.v1`. The stable page uses `tcard.v1`. Opening this file does not read or erase a stable log.
- Export from the stable page is JSON whose card id field is `ident`. Importing that file here copies `ident` into Name and leaves Serial blank.
- Export from this page still writes `ident` (Name, and Serial when there is one) so the stable v1.2 page can import it. An import replaces the open log. It does not merge.

## What this version adds

The notes in `changelog/` are the record. In short, exp.1 separates Name and Serial, adds short card ids, column and map drag-and-drop, a status color on the tile edge, and map, card, status-list, and board printing. Exp.2 adds smaller multi-card Letter layouts (2 × 3.5 in is the default, 10 per sheet; 1.5 × 2.5 in is 18 per sheet; 3.5 × 5 remains available), a blank status write-in, a rack-style board, and a 300 ms press-and-hold before a touch drag. Storage keys are the same as exp.1.

Nothing here was tested on Android.

## Source

`TCard_Tracker_v1.2-exp.2.html` is the page to open. It is exactly these files concatenated, in order, with nothing between them:

1. `src/head.html`
2. `src/body.html`
3. `src/app1.js`
4. `src/app2.js`
5. `src/app3.js`

The script text in the page is those three JavaScript files. Rebuild the page with:

```bash
python3 experimental/tcard/assemble.py
```

Run that from the repository root. It overwrites `TCard_Tracker_v1.2-exp.2.html` with the concatenation above.
