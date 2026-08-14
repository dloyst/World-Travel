/* ------------------------------------------------------------------
   itinerary.js — the single source of truth.
   index.html is just a renderer over this file. Edit here, reload there.

   Why .js and not .json: a <script src> tag works from a file:// page,
   but fetch() of a .json file is CORS-blocked in Chrome. This keeps the
   double-click-the-file case working with no signal and no web server.
   (It also means we get comments, which JSON doesn't allow.)

   SEGMENT KINDS
     anchor  fixed commitment. Has a real start date and night count.
     gap     unplanned stretch. Defined by its ENDPOINTS, not its blankness:
             "get from X to Y, using N nights."
     leg     a crossing between blocks. Renders as a thin connector, not a
             proportional block — nights: 0, because the travel day is
             absorbed by the gap on either side.

   STATUS  idea -> candidate -> decided -> booked
     Drives visual solidity. "idea" renders as a ghost, "booked" as solid.
     From across the room you can see how much of the trip is still vapor.
------------------------------------------------------------------- */

window.ITINERARY = {
  meta: {
    title: "Six Months",
    subtitle: "Oct 2026 – Apr 2027",
    start: "2026-10-15",   // soft — first day of her time off. Adjust when known.
    end:   "2027-04-15",   // soft — end of the non-compete window.
    currency: "USD",

    // Set this to a number to turn on the budget target + burn meter.
    budgetTarget: null,

    // Costs below are ILLUSTRATIVE so the budget lane has something to show.
    // Replace them with real numbers, then set this to false.
    usingSampleCosts: true,

    // Where you're departing from and returning to. Fill this in and the
    // routing math lights up for the first and last gaps.
    // home: { name: "Toronto", lat: 43.65, lon: -79.38 },
    home: null,
  },

  /* Ordered. The renderer checks that these chain end-to-end with no
     gaps or overlaps, and shows a warning banner if they don't. */
  segments: [
    {
      id: "gap-to-barcelona",
      kind: "gap",
      start: "2026-10-15",
      nights: 15,
      from: "Home",
      to: "Barcelona",
      toGeo: { lat: 41.39, lon: 2.16 },
      status: "idea",
      note: "Wide open. Could be a slow warm-up somewhere, or just a short pre-cruise buffer with more time spent at home.",
    },
    {
      id: "barcelona",
      kind: "anchor",
      name: "Barcelona",
      start: "2026-10-30",
      nights: 3,
      fixed: true,
      geo: { lat: 41.39, lon: 2.16 },
      status: "decided",
      cost: 900,
      note: "Two days before embarkation. Buffer against a missed connection — do not compress this.",
      seasonNote: "Mild, 18–21°C. Shoulder season.",
    },
    {
      id: "cruise",
      kind: "anchor",
      name: "Transatlantic crossing",
      start: "2026-11-02",
      nights: 14,
      fixed: true,
      mode: "ship",
      from: "Barcelona",
      to: "Dominican Republic",
      geo: { lat: 18.43, lon: -68.97 },
      status: "booked",
      cost: 6200,
      note: "Barcelona → Dominican Republic. Both a stay and a crossing.",
      seasonNote: "Tail of Atlantic hurricane season — ends Nov 30.",
    },
    {
      id: "gap-caribbean-to-budapest",
      kind: "gap",
      start: "2026-11-16",
      nights: 37,
      from: "Dominican Republic",
      fromGeo: { lat: 18.43, lon: -68.97 },
      to: "Budapest",
      toGeo: { lat: 47.5, lon: 19.04 },
      status: "idea",
      note: "Lands in the Caribbean, has to end in Central Europe. Five weeks and an ocean. The single biggest routing decision of the trip.",
    },
    {
      id: "leg-atlantic-east",
      kind: "leg",
      start: "2026-12-22",
      nights: 0,
      mode: "plane",
      from: "TBD",
      to: "Budapest",
      status: "idea",
      cost: 1400,
      note: "Departs from wherever gap 2 ends. A westbound-to-eastbound crossing four days before Christmas — peak-season pricing on a fixed date, so book it early.",
    },
    {
      id: "budapest",
      kind: "anchor",
      name: "Budapest — Christmas",
      start: "2026-12-23",
      nights: 4,
      fixed: true,
      geo: { lat: 47.5, lon: 19.04 },
      status: "decided",
      cost: 800,
      note: "Non-negotiable. A five-day European spike in an otherwise non-European six months — it costs two long-haul legs, so pick its neighbours to make those cheap.",
      seasonNote: "Cold, 0–4°C. Christmas markets run to Jan 1.",
    },
    {
      id: "leg-out-of-europe",
      kind: "leg",
      start: "2026-12-27",
      nights: 0,
      mode: "plane",
      from: "Budapest",
      to: "TBD",
      status: "idea",
      cost: 1200,
      note: "The other half of the Budapest spike — flies to wherever gap 3 begins.",
    },
    {
      id: "gap-winter",
      kind: "gap",
      start: "2026-12-27",
      nights: 64,
      from: "Budapest",
      fromGeo: { lat: 47.5, lon: 19.04 },
      to: "Japan",
      toGeo: { lat: 35.68, lon: 139.69 },
      status: "idea",
      note: "The big one. Nine weeks of deep northern winter, starting in Europe and ending positioned for Japan. Long enough to hold three or four separate stops — don't try to fill it with one idea.",
    },
    {
      id: "leg-to-japan",
      kind: "leg",
      start: "2027-03-01",
      nights: 0,
      mode: "plane",
      from: "TBD",
      to: "Tokyo",
      status: "idea",
      cost: 700,
      note: "Departs from wherever gap 3 ends. Choosing gap 3's last stop is really choosing this flight.",
    },
    {
      id: "japan",
      kind: "anchor",
      name: "Japan",
      start: "2027-03-01",
      nights: 24,
      fixed: false,
      // Floating anchor: ~3.5 weeks somewhere in March. It can slide.
      floating: { earliest: "2027-03-01", latest: "2027-03-07" },
      geo: { lat: 35.68, lon: 139.69 },
      status: "decided",
      cost: 7500,
      note: "About 3.5 weeks, somewhere in March. Sliding this later chases the cherry blossom front north — worth deciding deliberately rather than by default.",
      seasonNote: "Plum then cherry. Tokyo peak bloom is usually late Mar.",
    },
    {
      id: "leg-home",
      kind: "leg",
      start: "2027-03-25",
      nights: 0,
      mode: "plane",
      from: "Tokyo",
      to: "TBD",
      status: "idea",
    },
    {
      id: "gap-final",
      kind: "gap",
      start: "2027-03-25",
      nights: 21,
      from: "Japan",
      fromGeo: { lat: 35.68, lon: 139.69 },
      to: "Home",
      status: "idea",
      note: "Three weeks left over. Either a long slow decompression somewhere in Asia, or an early return home.",
    },
  ],

  /* THE BENCH — ideas not yet placed.
     These are SAMPLES to make the mechanism visible. Delete them and put
     your own in. `nights` is a [min, max] range; `months` is 1-indexed. */
  bench: [
    { id: "b1", name: "Mexico City & Oaxaca", region: "North America",
      geo: { lat: 19.43, lon: -99.13 }, nights: [14, 21], months: [11,12,1,2,3,4],
      note: "Easy hop from the Caribbean. Day of the Dead is Nov 1–2 — you'd just miss it." },
    { id: "b2", name: "Colombia — Medellín & the coast", region: "South America",
      geo: { lat: 6.24, lon: -75.58 }, nights: [14, 28], months: [12,1,2,3],
      note: "Short flight from Santo Domingo. Dry season Dec–Mar." },
    { id: "b3", name: "Argentina & Patagonia", region: "South America",
      geo: { lat: -34.6, lon: -58.38 }, nights: [21, 35], months: [11,12,1,2,3],
      note: "Southern summer. The only window Patagonia is properly open." },
    { id: "b4", name: "Thailand & northern Laos", region: "Southeast Asia",
      geo: { lat: 15.87, lon: 100.99 }, nights: [21, 35], months: [11,12,1,2],
      note: "Cool dry season. Sets up the Japan leg nicely." },
    { id: "b5", name: "Vietnam, top to bottom", region: "Southeast Asia",
      geo: { lat: 16.05, lon: 108.2 }, nights: [21, 30], months: [11,12,1,2,3,4],
      note: "Long and thin — rewards three weeks, punishes two." },
    { id: "b6", name: "Morocco", region: "North Africa",
      geo: { lat: 31.63, lon: -7.99 }, nights: [10, 18], months: [10,11,3,4],
      note: "Close to Europe, so cheap either side of the Budapest spike." },
    { id: "b7", name: "New Zealand road trip", region: "Oceania",
      geo: { lat: -41.0, lon: 174.0 }, nights: [18, 28], months: [12,1,2,3],
      note: "Peak southern summer. Very far from Budapest in both directions." },
    { id: "b8", name: "Taiwan & Seoul", region: "East Asia",
      geo: { lat: 25.03, lon: 121.57 }, nights: [12, 20], months: [3,4,10,11],
      note: "Sits right next to Japan — natural bookend before or after." },
    { id: "b9", name: "Cape Town & the Garden Route", region: "Southern Africa",
      geo: { lat: -33.92, lon: 18.42 }, nights: [14, 24], months: [11,12,1,2,3],
      note: "Southern summer. Awkward from the Caribbean, fine from Europe." },
  ],
};
