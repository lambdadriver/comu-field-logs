# Reference fragments

`comu-shared/` holds JavaScript and CSS that were inlined into the HTML pages before those pages were frozen. These fragments are reference only. Running them through a page generator is not what produced the public HTML, and this repository does not claim that regenerating the pages from these files reproduces `web/assets-www/` or `apps/` byte for byte.

The launcher page that ships in the APK is `web/assets-www/index.html`. That file is the source for the home screen. A separate launcher template from the private build is not included.

Copyright 2026 lambdadriver. GPL-3.0. See LICENSE.
