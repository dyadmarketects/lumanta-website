# Lumanta website redesign (mockup)

Interactive HTML mockup of the lumanta.co redesign, designed and built by **DYAD Marketects**.

**Live preview:** https://dyadmarketects.github.io/lumanta-website/

## What's on the page
1. **Loader**: the Lumanta logomark assembles from 72,000 particles (from the Particlefy export, recolored with the real logo gradient), then the camera flies through the ring to reveal the site.
2. **Hero**: full-bleed looping HD video, RISE / ABOVE / THE STATIC lockup (the O in ABOVE is the logomark), "Coming soon" store buttons, scroll-to-explore cue, animated wave mesh.
3. **Catch / Shift / Rise** cards that slide over the hero, with self-drawing icons.
4. **The static**: a pinned, scroll-driven particle story. Noise gathers into the logomark and the background dawns from night to the Lumanta off white. The cursor (desktop) or a finger (mobile) pushes the particles.
5. **What is Lumanta**: the product description with a tap animation.
6. **The app**: pinned phone walkthrough of the three steps, with color glows and particle rings behind the phone.
7. About statement, **Meet the founder** (Julie McCord), Research (placeholder), FAQ, Become a founding member, footer.

Every asset has a scroll intro and exit animation (GSAP ScrollTrigger + Lenis smooth scroll). Reduced-motion users get a static version.

## Structure
```
index.html
assets/css/style.css        brand tokens at the top (:root)
assets/js/main.js           all scroll choreography
assets/js/particles.js      WebGL particle engine (loader + "static" section)
assets/js/vendor/           GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13
assets/data/lumanta-particles.bin   logomark particle positions + colors
assets/video/hero-1080.mp4  desktop hero (H.264, ~9 MB)
assets/video/hero-720.mp4   phone hero (~4 MB)
assets/fonts/               Dazzle Unicase (Thin/Light/Medium/Bold), Poppins
```

## Brand
| Color | Hex |
|---|---|
| Ember orange | `#FF9A3C` |
| Glow pink | `#FF5F8A` |
| Lumen blue | `#1E6FD9` |
| Aurora aqua | `#2EDFCF` |
| Lumanta off white | `#FAF7F5` |

Headers: Dazzle Unicase (Thin, Light, Medium), set in caps, licensed for web use. Body: Poppins (OFL).

## Before launch
- Body copy for the cards, app steps, FAQ and research section is placeholder writing for client review.
- Live at https://lumanta.co (launched October 2026). Pages are indexable; 404.html stays noindex.
- To use lumanta.co: Settings > Pages > Custom domain, then point the domain's DNS to GitHub Pages.
