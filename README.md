# Six Months

A planning visualizer for Oct 2026 – Apr 2027. Two files, no build step, no dependencies.

```
index.html     the renderer
itinerary.js   the data — the single source of truth
```

Open `index.html` by double-clicking it, or serve it anywhere static.

---

## The idea

This isn't an itinerary viewer. At the time of writing **75% of the six months is
undecided** — so the tool's real job is filling four holes, where each hole is a
*routing problem* ("get from the Dominican Republic to Budapest, using 37 nights"),
not a blank stretch of calendar.

That's the thing a calendar can't express: gaps have endpoints.

### Design rules it follows

- **Time is proportional.** Every night is 11px. A 64-night gap really is 5× taller
  than a 13-night one. February and March are not the same size box.
- **Commitment reads as solidity.** `idea` → `candidate` → `decided` → `booked`
  renders as ghost → wash → filled. You can see from across the room how much of the
  trip is still vapor.
- **Gaps are labeled by their endpoints**, never by their emptiness.
- **Crossings are objects, not spaces.** Legs carry a date, a cost and a booking
  status of their own.
- **Anchors can float.** Japan is "~3.5 weeks somewhere in March", not a fixed date,
  and it renders with its slide range.

---

## Editing

Everything lives in `itinerary.js`. The renderer never writes to it.

### Add a stop

Insert a `kind: "anchor"` segment and reduce the neighbouring gap's `nights` to match.
The renderer checks that segments chain end-to-end and shows a warning banner if the
dates don't add up — so if you get it wrong, it will tell you.

```js
{
  id: "lisbon",
  kind: "anchor",
  name: "Lisbon",
  start: "2026-10-20",
  nights: 6,
  geo: { lat: 38.72, lon: -9.14 },
  status: "candidate",
  cost: 1100,
}
```

### Add an idea to the Bench

```js
{ id: "b10", name: "Sri Lanka", region: "South Asia",
  geo: { lat: 7.87, lon: 80.77 }, nights: [14, 21], months: [1,2,3],
  note: "Dry season on the south and west coasts." }
```

`months` is 1-indexed. `nights` is a `[min, max]` range.

### Turn on the budget

Set `meta.budgetTarget` to a number, replace the placeholder costs with real ones,
and set `meta.usingSampleCosts: false`.

### Set home

Fill in `meta.home` with `{ name, lat, lon }` and the routing math lights up for the
first and last gaps too.

---

## How fit is computed

Open a gap and the Bench filters to it, scoring each idea three ways:

| Check | How |
|---|---|
| **Duration** | idea's minimum nights vs. nights still unplaced in that gap |
| **Season** | idea's good months vs. the months the gap actually spans |
| **Route** | detour ratio — how much longer *from → idea → to* is than flying direct |

The route check is the useful one. From Budapest → Japan it rates Taiwan ×1.2 and
Thailand ×1.4 as on the way, Mexico ×2.4 and Argentina ×3.3 as far off it. From the
Dominican Republic → Budapest it puts Morocco at ×1.1. That's the whole point: a
nine-week gap looks infinitely flexible on a calendar, and isn't.

Thresholds live in `fitFor()` in `index.html` — ≤1.5 reads as "on the way", ≤2.2 as a
modest detour, above that as far off route. They're calibrated against the four real
gaps; if you change the anchors, sanity-check them.

---

## Notes

- **Why `.js` and not `.json`** — a `<script src>` tag works from a `file://` page;
  `fetch()` of a local `.json` is CORS-blocked in Chrome. This keeps the
  double-click-the-file case working with no signal.
- **Placements are local.** Cards you drop into gaps are saved to `localStorage` on
  that device — they're for playing with combinations, not a shared record. Once a
  decision is real, write it into `itinerary.js` as a segment.
- **Legs render at fixed height** rather than scaled, since a travel day at 11px
  would be invisible. Night counts in the labels stay honest.
- **Bench entries and all costs are sample data.** Replace them.

## Deploying

Settings → Pages → deploy from `main` → `/root`. No build step, so it serves as-is.
Add it to your phone's home screen and it behaves like an app.
