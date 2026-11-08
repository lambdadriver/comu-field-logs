# Validation — T-Card Tracker v1.2-exp.2

This page is experimental. It is not in the Android app. It was not tested on a phone. These checks are not a certification and they have no agency approval.

## File

| File | SHA-256 |
|---|---|
| `experimental/tcard/TCard_Tracker_v1.2-exp.2.html` | `49eadbe7333a9f3bf5089699892e8e0b4aee4d8ea6e52c33de43b835d64b0114` |

The file received from the source handoff, before the author credit was changed to lambdadriver and the GPL notice was added to the existing comment, was SHA-256 `ccb3a8b91133de6dbe33807466e1c7e39acfcc98fb4f7564e1cec4563ac22064`. Rebuilding with `python3 experimental/tcard/assemble.py` writes the new hash above. The three JavaScript files are copied into the page unchanged except for that credit in `src/app3.js`.

## Run on the cleaned file

November 8, 2026, on this Linux machine, Google Chrome, Playwright, and PyMuPDF. The test is `experimental/tcard/tests/t_exp.py`. The map is `tests/map.png` (a drawn grid labeled Staging and ICP). The import sample is `tests/sample.json`, synthetic equipment with no people and no contacts. The stable storage key was set to a sentinel and was still that sentinel after the experimental page saved.

**36 of 36 passed.** No console errors. No network requests.

```
PASS version shown
PASS name/serial separate fields
PASS tile shows sid/name/serial
PASS search by serial
PASS search by short ID
PASS export has name/serial/sid + mainline ident
PASS mainline import: ident->Name, serial blank
PASS short IDs unique after import
PASS mainline key untouched
PASS export->import round trip (name/serial/sid)
PASS drop target highlighted
PASS mouse drag changes status + history
PASS touch quick swipe does not drag
PASS touch hold arms drag (held outline)
PASS touch press-and-hold drag (tile body) changes status
PASS click tile opens status dialog
PASS map image stored as data URL
PASS mouse drag onto map sets x/y
PASS touch press-and-hold onto map sets x/y
PASS map placement + map view persist after reload
PASS x/y + map image round-trip through export
PASS marker dragged to tray is unplaced
PASS escaping holds (board, map, all prints x 3 card sizes)
PASS cards bc: 10 per Letter sheet, size, front only, cut marks
PASS board bc: rack strips = card strip, bottom slot = full card, width = card
PASS cards sm: 18 per Letter sheet, size, front only, cut marks
PASS board sm: rack strips = card strip, bottom slot = full card, width = card
PASS cards tc: 3.5x5 front+back still works, blank status box
PASS board tc: rack strips = card strip, bottom slot = full card, width = card
PASS board blank mode (no IDs)
PASS status list lists short ID + name
PASS map print: background + numbered pins + key
PASS no console errors
PASS no network requests
```

An earlier run of the same checks on the pre-cleanup file was recorded as 36 of 36. That log is not in this repository.

## Limits

- Separate storage from the stable T-Card. Import of a stable JSON copies the old id into Name and leaves Serial blank. Export still writes `ident` so stable v1.2 can import it. Import replaces the open log.
- Map images are chosen from a local file and stored in the page data. The page does not fetch them.
- Not included in the APK. Not tested on Android.
