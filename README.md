# mike_canfield_website
Coloring books, Trouble Monsters, Personal Power Pals, and family resources

`index.html` is the homepage; `posters.html` contains the complete printable poster
collection. `coloring-pages.html` previews all 19 black-line coloring pages with
free PDF downloads and links to the matching color posters. All pages share
`assets/site.css`. Poster video playback is handled
by `assets/posters.js`.

Poster downloads use single-page US Letter PDFs in `assets/printable/`. The full
artwork fits inside half-inch margins. Choose **Fit to page** when printing on A4
or another paper size.

Each poster has a color download and a black-line coloring download. Color source
images are in `assets/`; matching black-line artwork is in `assets/coloring/`.
Black-line PDF filenames end in `-blackline.pdf`.

After updating poster PNGs, rebuild the printable files on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-printable-posters.ps1
```
