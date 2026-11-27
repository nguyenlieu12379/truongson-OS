# Vendored: 3d-animator

- **Author:** @holcdenis (Instagram)
- **Source:** Google Drive zip `3d-animator.zip`, file id `1c0wkLKkfTnmKH30voOWjOYn9LHCgtfQV`
- **Zip sha256:** `6ce1d61e9ed8d5ab5161d48be9a71329f22092d6d6062cc1f3a24b924e8c2af3`
- **Zip date:** 2026-11-22
- **Vendored:** 2026-11-24
- **License:** none stated in the zip. OK for our own content (author asks to be tagged). Ask the author before using it for client work.
- **Changes:** none. `3D-Animator-Skill.pdf` (the setup guide) was left out.

## Windows notes (tested 2026-11-24)

- Node 26 LTS is installed portable at `%LOCALAPPDATA%\Programs\node` (on the user PATH). The winget MSI needs admin.
- npm 11 blocks puppeteer's postinstall, so its Chrome never downloads. Use the installed Chrome instead: `$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'` before `npm run stills`.
- On this laptop (Intel UHD 620): stills take about 1 s each at n=16; the 6 s preview at n=4 takes 90 s. A final at n=48 will be much slower, so measure first.
