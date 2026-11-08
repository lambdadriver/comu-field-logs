# T-Card Tracker v1.2-exp.1 (experimental side branch of v1.2)
by lambdadriver. Single offline HTML file. No network, data stays on the device.

Branch: forked from mainline T-Card v1.2. Mainline, the APK and the shared code are unchanged.
Storage keys: `tcard.exp1.v1` and `tcard.exp1.myinfo.v1`. It never touches mainline `tcard.v1` data.

## Changes
- **Name and Serial number are separate fields** in the editor, tiles, cards, sheets, search and CSV/JSON.
  - Old data and mainline JSON import as follows: the old ID / Name / Serial value goes into Name, and Serial stays blank.
  - The export also writes the old `ident` field, so mainline v1.2 can still import an exp file.
- **Short card IDs (T-001…)** appear on tiles, cards and every printout, so paper and app cross-reference.
- **Board is the main view, with Columns and Map toggles.**
  - Smooth pointer drag. On a computer, drag the whole tile with the mouse. On a phone or tablet, drag by the ⠿ grip so the page still scrolls.
  - The column under the card is highlighted. Dropping a card there changes its status and logs it in the history.
  - Each status has a color, set in Types and shown as the tile edge.
- **Map view.**
  - Load a map image from a file. It is downscaled and stored in the saved data, never fetched.
  - Drag cards anywhere on the map, and drag them back to the tray to remove them.
  - The x/y positions are saved and included in the JSON export. Without an image, a plain grid is used.
- **Printing.**
  - *Cards:* 3.5 × 5 in front and back pages, 2 per Letter page with cut marks. Each card now has its short ID, a status color strip and the version.
  - *Physical board:* the status columns have slots exactly 3.5 × 5 in, one folded card each. There are 2 columns × 2 slots per Letter sheet, tiled over as many sheets as needed. Each slot faintly shows the current card's ID and name, and this can be turned off to print a blank board.
  - *Status list:* the status list sheet now has Card, Name and Serial columns.
  - *Map:* the background prints with numbered markers and a key showing card, name, serial, type, status and location.
- The version is shown in the header, About, the footer and all printouts.
