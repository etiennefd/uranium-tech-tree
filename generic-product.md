# Notes for a generic tech-tree product

What would need to become configurable if this codebase were turned into a generic
product other people could use to build their own tech trees.

Today's state: the uranium fork has lots of things hardcoded (palette, field
taxonomy, data schema, branding, Airtable layout). For a generic version, the
cleanest end state is **one config file per concern** at the project root —
`theme.ts`, `schema.ts`, `connection-types.ts`, `data-adapter.ts`,
`branding.ts` — and every other file reads from those.

> Last reviewed 2026-06-01, after a round of uranium-specific polish: three new
> fields (Mining, Medicine, War), `strict`/`thematic` connection types,
> lowercase node titles, a live `?font=` switcher, 1895 timeline tuning,
> country-only locations, and trimmed tooltips/filters. The notes below reflect
> that state — several earlier hardcodings are gone, and a few new ones appeared.

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
  `FilterBox.tsx`, `utils/IntroBox.tsx`, `constants/fieldColors.ts`. The two
  recurring literals are `#1B0E2E` (surface) and `#C5C95C` (daylight accent) —
  the search/filter/zoom/settings chrome was recently unified to that node
  palette, so the values are now even more duplicated and even riper for a
  single source.
- [ ] Replace the BrutalistNode style itself with a `nodeVariant` choice
  (`"brutalist-light"`, `"uranium-dark"`, etc.) so light and dark themes are
  both first-class.
- [ ] Good precedent already set for fonts: `--font-app-mono` (in `globals.css`)
  is a single CSS variable the whole app reads through. Colors and the glow
  recipe should follow the same pattern.

## 2. Field taxonomy

- [ ] One source of truth for fields. Each field entry should specify:
  `{ name, color, band }`. Eliminates the parallel `FIELD_COLORS`
  (`constants/fieldColors.ts`) and `VERTICAL_BANDS` (inline in
  `TechTreeViewer.tsx`) maps that have to stay in sync. The pain is concrete:
  the list is now ~21 fields, and recent additions (Mining, Medicine, War) had
  to be hand-inserted into *both* maps, with `VERTICAL_BANDS` getting awkward
  half-step values (275, 345, 835) wedged between existing bands to slot them
  into the narrative order.
- [ ] `FIELD_COLORS` is now organized into comment-delimited "family hues"
  (materials, greens, cultural-pink, concepts). That grouping is documentation
  only — nothing enforces it. A config could make families first-class.
- [ ] Default fallback: color `#2D2D2D` (`DEFAULT_FIELD_COLOR`), band `1290`
  (the `Misc` slot) when a field isn't recognized.
- [ ] Make the field list importable so a generic deployment can do
  `defineFields([{ name: "Physics", color: "#…", band: 100 }, …])`.

## 3. Data schema

`TechNode` still carries vestigial fields from the historical tree (`subtitle`,
`tier`, `dateDetails`, `type`, `subfields`, `description`, `details`,
`inventors`, `organizations`, `city`, `countryHistorical`, `countryModern`,
`formattedLocation`, etc.). Each one drives a tooltip row and/or a search/filter
category — except several are now fetched-but-unused, which is its own smell:

- `organizations` and `wikipedia` are still loaded by the fetch script but no
  longer rendered (the tooltip's Organizations row and "View on Wikipedia" link
  were both removed).
- `city` is loaded only to be thrown away: the tooltip's location is now
  country-only (`cleanCountryForTooltip` strips the city/state prefix), and the
  City filter category was deleted.
- The tooltip rows were relabeled to terse, domain-flavored headers —
  **When:** / **Who:** / **Where:** — replacing Date / Inventor(s) / Location.

- [ ] Define a schema-config that lists each field with: `key`, `label`,
  `renderer` (`"text"`, `"list"`, `"link"`, `"date"`, …),
  `searchable: boolean`, `filterable: boolean`, `tooltipOrder: number`.
  Labels like "When/Who/Where" should be config, not literals in JSX.
- [ ] Tooltip section assembly should iterate that schema instead of being a
  hand-written ladder of `if (node.inventors) { … }` blocks in
  `TechTreeViewer.tsx`.
- [ ] Search index (`searchIndex` memo) should build itself from the schema.
- [ ] Filter categories (now `fields/subfields/countries` — `cities` was
  removed from `FilterState`, `FilterBox`, and the filter logic) should also
  come from the schema. A schema-driven design would have made that a one-line
  change instead of a four-file edit.

## 4. Connection types

`ConnectionType` union in `CurvedConnections.tsx` is now a *mix*: the uranium
fork's two real types (`strict`, `thematic`) were added on top of the
historical-tree's original list (`Prerequisite`, `Improvement`, `Speculative`,
`Inspiration`, `Component`, `Independently invented`, `Link plausible but
unclear`, `Concurrent development`, `Obsolescence`, `default`) without removing
any. The data only emits `strict`/`thematic`/`default`, so the rest are dead
union members kept alive by the tooltip/grouping code that still switches on
them. Stroke pattern logic in `getLineStyle` is hardcoded per type
(`thematic` shares the dashed `"2,4"` style with the legacy `Speculative`).

- [ ] Collapse to the types actually used, then make them a config:
  `{ name, label, strokeDash, arrowhead, tooltipVerb }`.
  - `tooltipVerb` for the sentence in `ConnectionTooltip` ("led to",
    "is thematically linked to", "was replaced by", …) — currently a hardcoded
    `switch (type)`.
  - `label` for the grouped tooltip rows in `TechTreeViewer` ("Built upon",
    "Led to", "Replaced", "Independently invented from", "Developed concurrently
    with")
  - `arrowhead` for the visual marker variation (square vs. arrow)
- [ ] Remove the now-orphaned special-cases for "Obsolescence" /
  "Independently invented" / "Concurrent development" in `getNodeConnections`
  grouping and minimap z-order — they categorize connection types the uranium
  data no longer produces.

## 5. Timeline / scale

The era-bracketed `getTimelineSegment` and `getTimelineYears` were built for
3-million-year spans. The uranium tree (1772–2019) never uses anything below the
two most-recent tiers — every constant from `YEAR_EARLY_MODERN` down is inert.
The fork tuned `YEAR_INDUSTRIAL` to **1895** so the sparse early decades get
5-year bins and the dense radioactivity era (1895+) gets 1-year columns; that
threshold is a uranium-specific data fact baked into a constant.

- [ ] Make the year unit + label formatter pluggable: linear time? log time?
  generations? geological eras?
- [ ] Configurable `pickInterval(range)` — today, intervals (and the era
  breakpoints that select them) are hardcoded inside the file.
- [ ] BCE/CE handling should be opt-in (a domain about software wouldn't need
  it).
- [ ] `YEAR_WIDTH`, `PADDING`, `NODE_WIDTH`, `VERTICAL_SPACING` should live in
  a layout config.
- [ ] New domain-specific layout hacks crept in and should be generalized or
  config-driven: `TOP_BAND_OFFSET` (pushes the whole tree down so the top band
  clears the timeline) and `INTRO_BOX_RIGHT_EDGE` / `INTRO_BOX_BOTTOM_CLEARANCE`
  (nudge any node sitting under the IntroBox downward — currently hand-tuned
  pixel values that assume the IntroBox's size and position, and that account
  for the node's `-75px` render transform).

## 6. Branding & metadata

- [ ] `IntroBox` is hand-written copy — now a title plus two paragraphs, two
  hardcoded external links ("Reality Is Joking About U" on hopefulmons.com, and
  "Historical Tech Tree" on historicaltechtree.com), a byline, and live
  node/connection counts pulled from the data. Should accept
  `{ title, description, byline, links[] }` and take the counts as props.
- [ ] Fonts are now loaded in `layout.tsx` as four families (Geist Sans/Mono
  local, Space Mono + IBM Plex Mono from Google) and selected through the
  `--font-app-mono` CSS variable (default Space Mono). A generic product should
  let a deployment declare its own font stack rather than ship four.
- [ ] `FontSwitcher.tsx` reads a `?font=space|plex|geist` query param to swap
  fonts live — a dev/comparison affordance that should be removed or formalized
  (it's not a real product feature).
- [ ] `layout.tsx` carries Open Graph + Twitter + manifest metadata that's
  domain-specific (title "Uranium Tech Tree", description, OG image).
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
  "Image URL", "Local image", "Image position", "Date added"); connections read
  "From", "To", "Type", "Details", "Details source". Several of these
  (Organization, Wikipedia, City) are still fetched but no longer surfaced in
  the UI (see §3) — a schema config would make "fetch but don't render" an
  explicit choice rather than dead weight.
- [ ] Filter logic (`year !== 9999`) is a uranium/historical-tree convention.
- [ ] Location-string conventions live in `utils/helpers.ts`:
  `cleanLocationForTooltip` strips a `" (unspecified)"` suffix, and
  `cleanCountryForTooltip` assumes `"City, State, Country"` ordering and keeps
  only the last comma-segment. Both encode how *this* data set writes places;
  a generic product should make location parsing/formatting part of the schema.
- [ ] Image-credits pipeline (`update_images.py`) assumes Wikimedia Commons
  and Google Patents.
- [ ] A generic version needs a `DataAdapter` interface: `loadNodes()` and
  `loadLinks()`. Adapters could ship for Airtable, Notion, Google Sheets,
  local JSON, CSV, plus a "bring your own loader" escape hatch.

## Smaller leftovers (one-off hardcoded domain assumptions)

- [ ] Special-case dedicated images in `BrutalistNode.tsx`
  (`specialNodeImages` map: "Stone tool", "Oldowan stone tool", "Acheulean
  stone tool") — irrelevant to uranium, irrelevant to a generic product.
- [x] ~~Title formatting special cases in `BrutalistNode.tsx`~~ — resolved:
  `formatTitle` (which force-uppercased titles and special-cased mRNA, p–n,
  Technetium-99m, pH, YInMn) was deleted. Titles now render exactly as authored,
  and the uranium data is lowercase by convention. A generic product should make
  display casing a theme choice (`as-authored` / `uppercase` / `lowercase`)
  rather than hardcoding it — note the field *tags* are still force-`uppercase`
  via a CSS class.
- [ ] Minimap "key years" array in `Minimap.tsx` — trimmed for the uranium fork
  to `[1800, 1850, 1900, 1925, 1950, 1975, 2000]` (the deep-time ticks and the
  small-screen filter were removed). Still a hand-maintained list of magic
  numbers; should come from the same interval picker as the main timeline.
- [ ] `lang="en"` hardcoded on the node container.
- [ ] Outbound links in the tooltip: the "View on Wikipedia" link was removed
  from the node tooltip (though `wikipedia` is still fetched and stored). A
  generic product should support N configurable link fields rather than zero or
  one hardcoded one.
- [ ] The `metadataBase` URL was `historicaltechtree.com` — removed in the
  uranium fork but a generic product needs per-deployment configuration.
- [ ] `placeholder-invention.jpg` is a domain-specific fallback image.
- [x] ~~Body `font-family: Arial…` hardcoded~~ — partly resolved: `globals.css`
  now drives the body font through the `--font-app-mono` variable (defaulting to
  Space Mono). Still leftover: four font families are loaded in `layout.tsx`
  when a deployment needs one, and the Geist locals are now largely unused (see
  §6).
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
