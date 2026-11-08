# T-Card Tracker v1.2-exp.2 (Oct 31)
- **Many small cards per Letter sheet.**
  - Default size is 2 × 3.5 in (business card), 10 per sheet.
  - The other choices are 1.5 × 2.5 in (18 per sheet) and the 3.5 × 5 T-card with front and back.
  - Small cards print the front only, on a grid with shared cut marks. They show the short ID and name on the top strip, plus a blank Status write-in box, the serial, the type and the category.
- **Printed status is now a blank write-in box** with a light colored border, on all sizes.
- **Physical board is rack style.**
  - Each slot shows only the top strip (ID and name) of the card above it, and the bottom slot in each column is full card height.
  - Slots match the selected card size: 26 per column per sheet at 2 × 3.5 in, 33 at 1.5 × 2.5 in, and 17 at 3.5 × 5.
  - Each slot faintly shows the current card's ID and name, and this can be turned off.
- **Touch drag:** press and hold about 300 ms anywhere on a tile. A quick swipe still scrolls. The grip and map markers still drag right away.
- Map position and status stay separate.
- Storage keys are unchanged from exp.1, so data carries over.

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
