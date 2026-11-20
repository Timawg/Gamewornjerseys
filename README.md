# Gamewornjerseys

A responsive, static gallery for the MoDo Hockey jersey collection. Includes an animated featured carousel, player and season search, filters, and accessible full-photo detail dialogs. Original photographs are displayed with rounded corners using CSS; the first Sundström JPG has been rotated losslessly to correct its orientation.

The **MoDo Hockey** tab is selected by default and includes the featured carousel. **Övriga lag / Other teams** contains a simple grid for 19 jerseys from other clubs, with player names, numbers, teams, search, and the same full-photo detail views. Open `#other-teams` to link directly to this collection.

Swedish is the default language. The SV/EN controls switch the interface, jersey types, image labels, and details between Swedish and English, and remember the visitor's choice. The background blends the club's red and green colours with a soft white gradient in the centre.

## Content

- `MODO MAPP/` holds the 23 jerseys and their original photographs and text files.
- `Övriga Lag/` holds the 19 jerseys and 38 original photographs imported from the separate collection.
- `collection.json` contains names, numbers verified from the photographs, seasons, photo order, and featured-player order. `featured: null` leaves a jersey out of the carousel.
- `MODO MAPP-2/` is an earlier copy of `MODO MAPP/` and is excluded from the website build.

Entries with `collection: "other"` appear on the Other teams tab and use their `team` field. Entries without a collection or team retain the MoDo defaults. A `null` textFile is allowed when a jersey has no associated text file; set it to a file path when adding a description.

Add the associated description to each jersey's existing `.txt` file. The next deployment reads that text and displays it in the carousel excerpt and full jersey view. Empty files use basic collection details without inventing a story. Both UTF-8 and UTF-16 text are supported. To add another jersey, add its folder and entry in `collection.json`.

## Preview

```sh
python3 scripts/build.py
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. No JavaScript packages or build dependencies are required. All paths are relative, including names with spaces and Swedish characters, so the site works under GitHub Pages' repository path.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and deploys the `dist/` folder on pushes to `main`. In the repository's **Settings → Pages**, select **GitHub Actions** as the source. Pages availability for private repositories depends on the GitHub account's plan; the workflow does not change repository visibility.

## Assets

The Gamewornjerseys identity uses a custom ivory hockey jersey icon with a copper collector's tag, generated with the built-in image generation tool. The logo is `assets/gamewornjerseys-logo.png`; its generation and refinement prompts are saved in `assets/gamewornjerseys-logo-prompt.txt`. The SVG favicon places that same unmodified image on a dark tile for visibility in light and dark browser tabs. The site name stays Gamewornjerseys in both interface languages.

The MoDo logo is served by [MoDo Hockey's official website](https://www.modohockey.se/) from its [Sportality logo asset](https://sportality.cdn.s8y.se/team-logos/modo1_modo.svg). Club trademarks belong to their owners. This is an independent collector's archive.

Barlow Condensed and Manrope fonts are bundled locally under the SIL Open Font License; see `assets/fonts/` for their licenses.
