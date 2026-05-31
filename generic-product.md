# Notes for a generic tech-tree product

What would need to become configurable if this codebase were turned into a generic
product other people could use to build their own tech trees.

Today's state: the uranium fork has lots of things hardcoded (palette, field
taxonomy, data schema, branding, Airtable layout). For a generic version, the
cleanest end state is **one config file per concern** at the project root —
`theme.ts`, `schema.ts`, `connection-types.ts`, `data-adapter.ts`,
`branding.ts` — and every other file reads from those.

## 1. Theme / palette

Currently ~10 hex literals scattered across files. Should collapse to a single
theme object.

- [ ] Extract all colors into `src/config/theme.ts`:
  - background, surface (card bg), accent (daylight), accent-dim,
    glow (UV), link, link-hover, text on dark, text on light, muted text,
    border-on-surface
- [ ] Theme should also carry the "glow" recipe (text-shadow rgba, box-shadow,
  drop-shadow filter) because we apply it in three places (title text, selected
  node, highlighted connection).
- [ ] Files currently holding raw colors: `globals.css`,
  `TechTreeViewer.tsx`, `nodes/BrutalistNode.tsx`,
  `connections/CurvedConnections.tsx`, `Minimap.tsx`, `SearchBox.tsx`,
  `FilterBox.tsx`, `utils/IntroBox.tsx`, `constants/fieldColors.ts`.
- [ ] Replace the BrutalistNode style itself with a `nodeVariant` choice
  (`"brutalist-light"`, `"uranium-dark"`, etc.) so light and dark themes are
  both first-class.

## 2. Field taxonomy

- [ ] One source of truth for fields. Each field entry should specify:
  `{ name, color, band }`. Eliminates the parallel `FIELD_COLORS` and
  `VERTICAL_BANDS` maps that have to stay in sync.
- [ ] Default fallback band when a field isn't recognized (today: 1290).
- [ ] Make the field list importable so a generic deployment can do
  `defineFields([{ name: "Physics", color: "#…", band: 100 }, …])`.

## 3. Data schema

`TechNode` still carries vestigial fields from the historical tree (`subtitle`,
`tier`, `dateDetails`, `type`, `subfields`, `description`, `details`,
`inventors`, `organizations`, `city`, `countryHistorical`, `countryModern`,
`formattedLocation`, etc.). Each one drives a tooltip row and/or a search/filter
category.

- [ ] Define a schema-config that lists each field with: `key`, `label`,
  `renderer` (`"text"`, `"list"`, `"link"`, `"date"`, …),
  `searchable: boolean`, `filterable: boolean`, `tooltipOrder: number`.
- [ ] Tooltip section assembly should iterate that schema instead of being a
  hand-written ladder of `if (node.inventors) { … }` blocks in
  `TechTreeViewer.tsx`.
- [ ] Search index (`searchIndex` memo) should build itself from the schema.
- [ ] Filter categories (currently `fields/subfields/countries/cities`) should
  also come from the schema.

## 4. Connection types

`ConnectionType` union in `CurvedConnections.tsx` is the historical-tree's
list. Stroke pattern logic in `getLineStyle` is hardcoded per type.

- [ ] Connection-types config: `{ name, label, strokeDash, arrowhead, tooltipVerb }`.
  - `label` for the line in the tooltip ("Built upon", "Led to", "Replaced",
    "Independently invented from", "Developed concurrently with")
  - `arrowhead` for the visual marker variation (square vs. arrow)
- [ ] Remove the hardcoded special-cases for "Independently invented" /
  "Concurrent development" in tooltip grouping and minimap z-order.

## 5. Timeline / scale

The era-bracketed `getTimelineSegment` and `getTimelineYears` were built for
3-million-year spans. Uranium tree never uses anything but industrial intervals.

- [ ] Make the year unit + label formatter pluggable: linear time? log time?
  generations? geological eras?
- [ ] Configurable `pickInterval(range)` — today, intervals are hardcoded
  inside the file.
- [ ] BCE/CE handling should be opt-in (a domain about software wouldn't need
  it).
- [ ] `YEAR_WIDTH`, `PADDING`, `NODE_WIDTH`, `VERTICAL_SPACING` should live in
  a layout config.

## 6. Branding & metadata

- [ ] `IntroBox` is hand-written copy. Should accept `{ title, subtitle,
  description, byline, links[] }`.
- [ ] `layout.tsx` carries Open Graph + Twitter + manifest metadata that's
  domain-specific (title, description, OG image, base URL).
- [ ] Favicon (SVG + PNG family) + apple-touch-icon + Android Chrome icons +
  `site.webmanifest`. The favicon generation pipeline
  (`favicon.svg` → `sharp` → PNGs → Pillow → `.ico`) is reusable but
  expects you to write the SVG yourself.
- [ ] `og-image.png` is a uranium-tree image; a generic product needs either
  per-deployment OG images or a way to template one.
- [ ] Vercel `@vercel/analytics` is hardcoded in `layout.tsx`. Make it
  opt-in / swappable.

## 7. Data source

`src/scripts/fetch-and-save-inventions.ts` is Airtable-specific:

- [ ] Table names ("Innovations", "Connections") hardcoded.
- [ ] Field names hardcoded ("Name", "Date", "Field(s)", "Inventor(s)",
  "Organization", "City", "Country (modern borders)", "Wikipedia",
  "Image URL", "Local image", "Image position", "Date added").
- [ ] Filter logic (`year !== 9999`) is a uranium/historical-tree convention.
- [ ] Image-credits pipeline (`update_images.py`) assumes Wikimedia Commons
  and Google Patents.
- [ ] A generic version needs a `DataAdapter` interface: `loadNodes()` and
  `loadLinks()`. Adapters could ship for Airtable, Notion, Google Sheets,
  local JSON, CSV, plus a "bring your own loader" escape hatch.

## Smaller leftovers (one-off hardcoded domain assumptions)

- [ ] Special-case dedicated images in `BrutalistNode.tsx`
  (`specialNodeImages` map: "Stone tool", "Oldowan stone tool", "Acheulean
  stone tool") — irrelevant to uranium, irrelevant to a generic product.
- [ ] Title formatting special cases in `BrutalistNode.tsx`
  (`formatTitle` knows about mRNA, p–n, Technetium-99m, pH, YInMn). Should be
  a config-supplied list of "preserve casing" tokens.
- [ ] Minimap "key years" array in `Minimap.tsx`
  (`[-100000, -10000, -1000, 0, 500, 1000, 1500, 1750, 1800, 1850, 1900,
  1950, 2000]`) — these are historical-tech-tree numbers; should come
  from the same interval picker as the main timeline.
- [ ] `lang="en"` hardcoded on the node container.
- [ ] Wikipedia link is the only outbound-link affordance in the tooltip.
  Should be one of N configurable link fields.
- [ ] The `metadataBase` URL was `historicaltechtree.com` — removed in the
  uranium fork but a generic product needs per-deployment configuration.
- [ ] `placeholder-invention.jpg` is a domain-specific fallback image.
- [ ] Body `font-family: Arial, Helvetica, sans-serif` in `globals.css` and
  Geist webfonts in `layout.tsx` should be theme-driven.
- [ ] Animation timings (transition durations, pulse animation, image
  fade-in) — minor but should live with the theme.

## Suggested architecture for the generic version

```
src/
  config/
    theme.ts          # all colors, fonts, glow recipes, motion timings
    schema.ts         # data fields + tooltip/search/filter behavior
    fields.ts         # field taxonomy: name → color → band
    connections.ts    # connection types: stroke style, labels, arrowheads
    timeline.ts       # year unit, interval picker, formatter
    branding.ts       # title, intro copy, OG metadata, favicon, links
    adapter.ts        # chosen DataAdapter implementation
  adapters/
    airtable.ts
    notion.ts
    json.ts
    sheet.ts
  components/         # unchanged; reads everything from config/
```

A deployment forks the repo (or installs it as a template), edits the seven
config files, drops their data adapter in, and ships.

## Things this codebase has already done well, worth preserving

- The brutalist node visual aesthetic is distinctive and works in both light
  and dark themes if you decouple it from the background palette.
- Curved connections with per-type stroke patterns are genuinely useful
  beyond tech trees.
- Drag-to-scroll + Cmd/Ctrl+wheel zoom + minimap is the right interaction
  trio for a wide horizontal canvas.
- Year-grouped vertical band layout (sort within a year by primary field,
  then jitter to avoid overlap) is general-purpose and worth keeping.
- The pre-rendered JSON cache approach (`techtree-data.json` baked at build
  time) keeps the runtime fast and the deployment simple.
