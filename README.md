# Miguel Faraj — Portfolio

Personal portfolio site. Plain HTML, CSS and JavaScript: no build step, no frameworks, and the fonts are included, so it works offline and on any static host.

When the page opens, a swarm of cursor "agents" builds it live: blue wireframes appear, text types itself in, and images fill from placeholders. Scroll down and they keep building each section as it comes into view.

```
index.html              page content (all text lives here)
css/style.css           design and build-animation styles
js/build.js             the live-build engine (agents, wireframes, typing)
js/visuals.js           the project "screens" drawn in SVG
js/main.js              filters, search, pages, before/after slider, copy buttons, clock
js/particles.js         the particle portrait in the hero (WebGL)
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

## Particle portrait

Click the hero photo and it bursts into a glowing 3D point cloud of you that turns with the mouse, and the big "PORTFOLIO" word changes from red to silver. Click again to bring the photo back. It also plays once on its own a few seconds after the page finishes building, then returns to the photo after 9 seconds.

The particles are made from `assets/miguel.webp`, so changing the photo changes the portrait. Browsers only allow this when the page is served from a web address (GitHub Pages, or Live Server locally). If you open `index.html` by double-clicking, everything else works but the photo stays a normal photo.

## Editing

- **Text:** everything is in `index.html`, split by comments (`<!-- HERO -->`, `<!-- 01 WORK -->`, and so on).
- **Projects:** each project is an `<article class="card">`. Copy one to add more. `data-c` sets its filter (`scada`, `iiot`, `data`, `software`, `rnd`) and `data-viz` picks its drawing (`hmi`, `dash`, `net`, `hist`, `api`, `radar`). To use a real screenshot instead, replace `<div class="viz" …></div>` with `<img src="assets/your-image.jpg" alt="…">`.
- **Build animation:** any element with `data-b` gets built by an agent. Use `data-b="type"` (types in), `wipe` (sweeps in), `pop` (pops in) or `media` (blue placeholder, then fills). Remove the attribute to make an element appear normally.
- **Number of agents / speed:** top of `js/build.js` (`N = isMobile ? 6 : 14`).
- **Colours:** variables at the top of `css/style.css` (`--red` is the accent).

The **Replay build** button in the footer runs the animation again. Anyone with "reduce motion" turned on in their system settings sees the finished page straight away.
