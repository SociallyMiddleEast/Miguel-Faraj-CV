# Miguel Faraj — Portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript: no build step, no frameworks, and the fonts are included, so it works offline and on any static host.

When the page opens, a swarm of cursor "agents" builds it live: blue wireframes appear, text types itself in, images fill from placeholders, and a counter at the bottom tracks the layers. Scroll down and they keep building each section as it comes into view.

```
index.html              page content (all text lives here)
css/style.css           design and build-animation styles
js/build.js             the live-build engine (agents, wireframes, typing, HUD)
js/visuals.js           the project "screens" drawn in SVG
js/main.js              filters, search, pages, before/after slider, copy buttons, clock
assets/miguel.webp      portrait (background removed)
assets/Miguel_Faraj_CV.pdf
assets/fonts/           Anton, Kaushan Script, Manrope (SIL Open Font License)
```

## Publish on GitHub Pages

1. Create a repository named `YOUR-USERNAME.github.io` (gives the address `https://YOUR-USERNAME.github.io`).
2. Upload everything in this folder to the repository root ("Add file → Upload files").
3. Go to **Settings → Pages**, set **Source** to "Deploy from a branch", pick `main` and `/ (root)`, and **Save**.
4. After a minute the site is live at that address.

To preview on your computer first, open the folder in VS Code and use the Live Server extension (opening `index.html` directly by double-click also works).

## Editing

- **Text:** everything is in `index.html`, split by comments (`<!-- HERO -->`, `<!-- 01 WORK -->`…).
- **Projects:** each project is an `<article class="card">`. Copy one to add more. `data-c` sets its filter (`scada`, `iiot`, `data`, `software`, `rnd`) and `data-viz` picks its drawing (`hmi`, `dash`, `net`, `hist`, `api`, `radar`). To use a real screenshot instead, replace `<div class="viz" …></div>` with `<img src="assets/your-image.jpg" alt="…">`.
- **Build animation:** any element with `data-b` gets built by an agent. Use `data-b="type"` (types in), `wipe` (sweeps in), `pop` (pops in) or `media` (blue placeholder, then fills). Remove the attribute to make an element appear normally.
- **Number of agents / speed:** top of `js/build.js` (`N = isMobile ? 6 : 12`).
- **Colours:** variables at the top of `css/style.css` (`--red` is the accent).

Visitors can press **Touring** on the bottom panel to skip the build, **Replay** to watch it again, or × to hide the panel. Anyone with "reduce motion" turned on in their system settings sees the finished page straight away.
