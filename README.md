# Johnmark Ochieng · personal site

Static HTML/CSS/JS site, hosted on GitHub Pages.

- `index.html`: main page (about, services, events, writing, experience, contact)
- `rates-k7q2.html` + `rates.js`: the rate card and quote estimator. **Unlisted**: not linked from the site and hidden from search engines; share the link with clients directly. Prices live at the top of `rates.js` and on the cards in `rates-k7q2.html`.
- `rates.html`: the old public address; it now forwards visitors to the Contact section and tells search engines to drop it.
- `styles.css`: all styling; colours are set at the top under `:root`
- `main.js`: starfield, animations and menu
- `assets/`: photo, article images and logo
- `build.py`: bundles each page into a single self-contained `*-preview.html` for sharing offline

To add an event, copy one `<li>` block in the "On stage" list in `index.html`.

## Motion layer

- `motion.css`: all motion styles. Timings and easing are variables at the top (`--motion-fast`, `--motion-base`, `--motion-slow`, `--motion-ease`).
- `motion.js`: small independent features: hero sky (starfield + shooting stars), scroll progress, back-to-top, reveal stagger, orbital accents, image frames. Each fails safely on its own.
- Hero sky tuning (star count, brightness, shooting-star gap) is at the top of `heroSky()` in `motion.js`.
- Reduced-motion users get a still version of everything.
