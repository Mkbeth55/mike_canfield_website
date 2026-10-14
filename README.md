# mike_canfield_website
Coloring books, Trouble Monsters, Personal Power Pals, and family resources

Poster downloads use single-page US Letter PDFs in `assets/printable/`. The full
artwork fits inside half-inch margins. Choose **Fit to page** when printing on A4
or another paper size.

After updating poster PNGs, rebuild the printable files on Windows:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-printable-posters.ps1
```
