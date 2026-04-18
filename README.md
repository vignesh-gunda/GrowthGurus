# Campaigns on auto pilot

Next.js app for the geo-targeted marketing loop described in [plan.md](./plan.md).

## Starting slice

This app now starts where your product flow actually starts:

- onboarding captures campaign inputs
- San Francisco uses the bundled dataset in `data/instagram.json`
- the workspace can refresh San Francisco Instagram data from Apify if `APIFY_API_TOKEN` is configured
- the mock output is normalized into GeoJSON
- Mapbox renders hotspots and placement candidates from that normalized data

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env:

```bash
cp .env.example .env.local
```

3. Add a public Mapbox token to `.env.local`:

```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk...
```

Optional for live Phase 1 refresh:

```bash
APIFY_API_TOKEN=apify_...
```

4. Start the app:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Next steps

- move `generateMockCampaign()` into a server-side normalization layer
- extend the Apify route to support more query/location controls
- normalize actor datasets into the same GeoJSON and placement schema
- persist onboarding config, zones, and allocations in storage
- feed selected zones into the Phase 2 market manager
