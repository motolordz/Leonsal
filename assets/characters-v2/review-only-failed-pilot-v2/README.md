# Failed Pilot V2 Character Assets

These 40 PNG/WebP derivatives are review-only and are not production-approved.

Why rejected:

- Derived from JPEG poster/chart reference sheets.
- Source subjects are below the production resolution target.
- Several states contain chart labels, gauge fragments, borders, or neighbouring sheet artifacts.
- They are not clean final character masters.

Runtime rule:

- Production code must not load assets from this folder.
- `data/character-assets.json` may reference these paths only under `reviewOnlyAssets`.
- Only registry records with `status: "approved"` may expose runtime `states`.

