# Geo-Targeted Marketing Campaign Engine
### Application Plan v1.0

---

## Overview

A four-phase autonomous marketing engine that moves from raw geographic and social data through audience intelligence, strategy planning, and finished creative assets — all optimized per target location across any city or region. The system is agent-driven: each phase feeds the next automatically, and a performance feedback loop continuously re-scores locations and regenerates assets based on live campaign data.

This plan is product-agnostic and campaign-agnostic. It applies to any consumer product, service, app, or brand running a location-targeted out-of-home or digital campaign.

---

## Core Concepts

**Zone** — a geographic area identified by the heatmap as having high audience concentration and traffic. Every deliverable in this system is keyed to a zone.

**Audience brief** — a structured profile of who is present in a zone: demographics, lifestyle signals, identity archetype, and product fit score.

**Hook** — the felt tension that makes a person receptive to a product message. Not a feature. Not a tagline. A moment the audience recognizes as their own.

**Creative package** — the complete set of campaign assets for a zone: budget allocation, messaging hooks, slogans, visual brief, and video scripts.

---

## Architecture: Four-Phase Pipeline

```
Phase 1: Geo + Social Data Collection
              ↓
Phase 2: Market Manager Agent
              ↓
Phase 3: Strategy Planner Agent
              ↓
Phase 4: Creative Agent
              ↓
    Per-Zone Deliverable Package
              ↑
    Performance Feedback Loop
    (CTR, impressions, conversions)
```

---

## Phase 1 — Geo + Social Data Collection

### Purpose
Collect geographic, demographic, and social activity data for every target zone to establish where audiences are, how active they are, and who they are.

### Components

#### 1.1 Social Media Scraper

**Recommended platform: Instagram**
Instagram is the primary source because it provides native latitude/longitude on geotagged posts, has the highest Apify scraper reliability (>90% success rate), and requires no session cookies for public data. The official `apify/instagram-search-scraper` actor is the recommended tool.

Alternative platforms and their tradeoffs:

| Platform | Geo signal quality | Apify reliability | Notes |
|---|---|---|---|
| Instagram | High — native lat/lng | >90% | Recommended default |
| Twitter / X | Medium — geocoded tweets | Variable at scale | Good for real-time signals |
| TikTok | Medium — location tags | <90% without cookies | Better for youth-skewed products |
| Google Maps | High — business clusters | >90% | Best for foot traffic inference |

**Input:** List of target location names or zip codes within the campaign region  
**Output per zone:**
- `latitude` / `longitude`
- `post_count_daily` — post density
- `avg_engagement` — likes + comments per post
- `top_hashtags` — interest and lifestyle signals
- `location_id` — platform place ID

**Scheduling:** Run on campaign launch, then on a weekly refresh cadence.

#### 1.2 Demographic Scraper

**Recommended tool:** Apify `tropical_quince/census-data-scraper` (US) or equivalent national census API for other regions.

**Input:** Zip codes or administrative boundaries for each zone  
**Output per zone:**
- `median_household_income`
- `median_age`
- `population_density`
- `education_level`
- `dominant_employment_sector`
- `commute_patterns`

#### 1.3 Heatmap Rendering

**Recommended tool: Mapbox GL JS**

Mapbox is selected over Google Maps and Apple Maps for this use case because it offers a native WebGL `heatmap` layer type that renders tens of thousands of geo-points smoothly at city scale, 100K free requests/month then $2 per 1K (vs Google's $5 per 1K), and Apple Maps has no heatmap layer API support at all.

**Input:** GeoJSON FeatureCollection of scraped posts with lat/lng and engagement weight  
**Output:**
- Interactive heatmap of the target region, intensity weighted by `post_density × avg_engagement`
- Ad placement markers overlaid on heatmap hotspots
- Filter controls by platform, time range, and engagement threshold

#### 1.4 Placement Zone Identification

From the heatmap, identify the highest-reach physical locations for ad placements. Record the following for each candidate:

| Field | Description |
|---|---|
| `placement_id` | Unique identifier |
| `label` | Human-readable name |
| `lat` / `lng` | Coordinates |
| `placement_type` | Billboard, transit, digital screen, etc. |
| `est_daily_impressions` | From vendor data or traffic APIs |
| `peak_hours` | When foot or vehicle traffic peaks |

### Phase 1 Data Schema (per zone)
```json
{
  "zone_id": "string",
  "label": "string",
  "lat": "float",
  "lng": "float",
  "social": {
    "post_count_daily": "int",
    "avg_engagement": "float",
    "top_hashtags": ["string"]
  },
  "demographics": {
    "median_income": "int",
    "median_age": "float",
    "population_density": "int",
    "dominant_sector": "string"
  },
  "traffic": {
    "daily_count": "int",
    "peak_hours": ["string"],
    "placement_type": "string"
  }
}
```

---

## Phase 2 — Market Manager Agent

### Purpose
Autonomous AI agent that ingests zone data from Phase 1, scores each location by reach potential, profiles the audience, allocates campaign budget across zones, and enforces budget constraints iteratively.

### Agent Configuration
- **Model:** `claude-sonnet-4-6` via Anthropic API
- **Pattern:** Structured JSON in → structured JSON out
- **Trigger:** Phase 1 data refresh (scheduled or manual)
- **Endpoint:** `POST https://api.anthropic.com/v1/messages`

### Components

#### 2.1 Location Scorer

Computes a normalized reach score (0–100) per zone.

```
reach_score = (post_density_normalized   × weight_A)
            + (avg_engagement_normalized × weight_B)
            + (daily_traffic_normalized  × weight_C)
```

Default weights: `weight_A = 0.35`, `weight_B = 0.30`, `weight_C = 0.35`  
Weights are configurable per campaign depending on whether social activity or physical traffic is the more important signal.

#### 2.2 Audience Profiler

Merges social signals and demographic data into a structured audience profile per zone.

**Output fields:**
- `dominant_age_bracket`
- `income_tier` — low / mid / mid-high / high
- `lifestyle_signals` — inferred from top hashtags and sector data
- `identity_archetype` — the agent's classification of who this audience sees themselves as
- `product_fit_score` (0–100) — how well this audience matches the campaign's target customer

**On identity archetypes:** The agent classifies each zone into one dominant archetype from the data. Archetypes are generated from signals — not pre-assigned from a fixed list. The agent should describe who this audience aspires to be, not just who they are on paper.

#### 2.3 Budget Allocator

Distributes total campaign budget across zones proportional to each zone's weighted score.

```
zone_budget = total_budget
            × (reach_score × product_fit_score)
            / sum(reach_score × product_fit_score across all zones)
```

**Constraint checker enforces:**
- Sum of all zone budgets ≤ total budget cap
- No single zone receives more than `max_zone_share` of total budget (default: 40%)
- At least `min_zones` zones are funded above a minimum viable threshold

If constraints fail, the re-balancer scales down the lowest `product_fit_score` zones and re-runs. The loop continues until all constraints are satisfied.

#### 2.4 Agent System Prompt Structure
```
System:
You are a market manager agent for a geo-targeted advertising campaign.
Given zone data and a total campaign budget, you will:
1. Score each zone by reach potential.
2. Profile the audience in each zone using demographic and social signals.
3. Classify each zone's dominant identity archetype from lifestyle signals.
4. Compute a product_fit_score (0-100) per zone given the product brief.
5. Allocate budget proportional to (reach_score × product_fit_score).
6. Enforce the total budget cap — reduce lowest-fit zones if over budget.
7. Return a structured JSON allocation plan.

Product brief: {product_brief}
Total budget: {total_budget}

User:
{zone_data_json}
```

### Phase 2 Output Schema
```json
{
  "allocation_plan": [
    {
      "zone_id": "string",
      "reach_score": "float",
      "audience_profile": {
        "dominant_age_bracket": "string",
        "income_tier": "string",
        "lifestyle_signals": ["string"],
        "identity_archetype": "string",
        "product_fit_score": "float"
      },
      "budget_allocated": "float",
      "priority_tier": "int (1 = highest)"
    }
  ],
  "total_allocated": "float",
  "zones_funded": "int",
  "rebalance_iterations": "int"
}
```

---

## Phase 3 — Strategy Planner Agent

### Purpose
Takes the audience brief from Phase 2 and produces the full messaging strategy for each zone: identity mapping, tension finding, product bridging, and the hook engine that generates campaign-ready angles.

### Agent Configuration
- **Model:** `claude-sonnet-4-6`
- **Pattern:** Reasoning chain — identity → tension → bridge → hooks → brief
- **Input:** Phase 2 audience profile per zone + product brief
- **Output:** Complete strategy brief per zone

### Product Brief (set once at campaign setup)

| Field | Description |
|---|---|
| `product_name` | Name of the product or service |
| `product_category` | What category it competes in |
| `core_promise` | The single thing it does for the customer |
| `brand_personality` | Tone and character of the brand |
| `existing_brand_equity` | What the audience already associates with this brand |
| `target_customer_description` | Who the ideal customer is in plain language |

### Components

#### 3.1 Identity Mapper

For each zone's audience archetype, the agent defines two states:

- **Current self:** Who the person actually is right now — their daily reality, frustrations, and unmet needs
- **Aspirational self:** Who they want to be — their goals, how they want to be seen, what success feels like to them

The gap between these two states is where the campaign lives.

#### 3.2 Tension Finder

Identifies the specific felt moment that makes this audience receptive to the product. A tension is not a pain point on a slide — it is a scene the audience can picture themselves in.

```
Tension structure:
"[Specific moment] when [current-self reality]
 but [aspirational-self standard is not yet met]."
```

The agent outputs one primary tension and two secondary tensions per zone.

#### 3.3 Product Bridge

Positions the product as the tool that closes the gap between current self and aspirational self. The product is never the hero — the audience is. The product is what the hero uses.

```
Bridge structure:
"[Product] is what [archetype] reaches for when [tension moment]
 because it [specific functional or emotional outcome]."
```

#### 3.4 Hook Engine

Generates the campaign hook per zone — a sentence or phrase that creates immediate self-recognition in the target audience.

**Hook rules:**
1. Never open with the product name
2. Start with the tension moment or the identity statement
3. The audience should think "that's me" before they think "that's an ad"
4. The product appears as a response, not the subject

**Output per zone:**
- 1 primary hook
- 2–3 variants for A/B testing

#### 3.5 Campaign Brief Generator

Combines all of the above into a structured brief ready for a creative team or the Creative Agent in Phase 4.

### Phase 3 Output Schema
```json
{
  "zone_id": "string",
  "strategy": {
    "identity_archetype": "string",
    "current_self": "string",
    "aspirational_self": "string",
    "primary_tension": "string",
    "secondary_tensions": ["string"],
    "product_bridge": "string",
    "primary_hook": "string",
    "hook_variants": ["string"],
    "campaign_tone": "string",
    "visual_direction": "string",
    "emotional_trigger": "string",
    "messaging_do": ["string"],
    "messaging_dont": ["string"]
  }
}
```

---

## Phase 4 — Creative Agent

### Purpose
Takes the strategy brief from Phase 3 and generates production-ready creative assets: slogan variants, visual/logo briefs as image generation prompts, and video scripts in multiple cut lengths.

### Agent Configuration
- **Model:** `claude-sonnet-4-6`
- **Pattern:** Strategy brief in → structured creative package out
- **Downstream tools:** DALL-E 3 / Midjourney / Adobe Firefly (images), Sora / Runway ML / HeyGen (video)

### Components

#### 4.1 Slogan Generator

Compresses the hook into the shortest version that still carries the tension. Target 3–7 words for out-of-home placements, up to 12 words for digital ads.

**Output per zone:**
- 1 primary slogan
- 3–5 A/B testable variants
- 1 CTA variant for digital placements requiring a direct response line

**Slogan generation rules:**
- Start with the tension or the identity, not the product
- Match the language register the archetype actually uses
- The brand name appears last or not at all on the primary line
- Variants explore different emotional angles: urgency, aspiration, belonging, defiance

#### 4.2 Visual / Logo Brief Engine

Generates a structured image generation prompt and visual direction for each zone. This is not the final image — it is the brief that feeds a downstream image generation tool.

```json
{
  "zone_id": "string",
  "image_gen_prompt": "string",
  "style_direction": "string",
  "color_palette": ["hex"],
  "mood": "string",
  "subject": "string",
  "composition_notes": "string",
  "what_to_avoid": ["string"],
  "recommended_tool": "DALL-E 3 / Midjourney v6 / Adobe Firefly"
}
```

**Visual brief rules:**
- The image should show the tension moment or the aspirational state, not a product on a white background
- Human subjects should match the identity archetype of the zone
- Color palette derives from the brand's existing equity, adapted to the zone's emotional tone
- The product may appear in the scene but should not be the focal subject

#### 4.3 Video Script Agent

Generates scene-by-scene scripts in three standard cut lengths. Every script follows a five-beat arc:

| Beat | Purpose | Length guidance |
|---|---|---|
| 1 — Tension open | Show the felt moment. No product. Audience self-identifies. | 20–30% of runtime |
| 2 — Identity moment | Deepen who this person is and what's at stake. | 20–25% of runtime |
| 3 — The shift | A decision. A reach. Something changes. | 10–15% of runtime |
| 4 — Product | The product appears as the natural response. | 15–20% of runtime |
| 5 — Resolution + CTA | The aspirational state. Where they wanted to be. | 15–20% of runtime |

**Cut lengths:**
- **15s** — Tension open + product + tagline. For social pre-roll and paid social.
- **30s** — Full five-beat arc compressed. For pre-roll, OOH digital screens, TV.
- **60s** — Full arc with room to breathe. For YouTube, long-form social, brand film.

**Script output format per scene:**
```
[Timecode]  VISUAL: [scene description]
            AUDIO:  [dialogue / voiceover / sound design]
            TEXT:   [on-screen text if applicable]
```

#### 4.4 Downstream Video Generation Pipeline

| Use case | Recommended tool | Notes |
|---|---|---|
| Cinematic 15–30s spots | Sora / Runway ML Gen-3 | Text-to-video from scene descriptions |
| Long-form 60s brand film | Runway ML with director mode | Scene-by-scene control |
| Talking-head / testimonial | HeyGen | AI avatar or real talent |
| Social cut-downs | Opus Clip | Auto-clips from 60s master |
| Static ad variants | DALL-E 3 / Midjourney v6 | From visual brief prompts |

### Phase 4 Output Schema
```json
{
  "zone_id": "string",
  "creative_package": {
    "slogans": {
      "primary": "string",
      "variants": ["string"],
      "cta_variant": "string"
    },
    "visual_brief": {
      "image_gen_prompt": "string",
      "style_direction": "string",
      "color_palette": ["hex"],
      "mood": "string",
      "recommended_tool": "string"
    },
    "video_scripts": {
      "15s": { "beats": [{ "timecode": "string", "visual": "string", "audio": "string" }] },
      "30s": { "beats": [ "..." ] },
      "60s": { "beats": [ "..." ] }
    }
  }
}
```

---

## Performance Feedback Loop

After assets launch, performance signals flow back to Phase 2 to close the autonomous loop and continuously improve the campaign.

### Signals tracked per zone

| Signal | Source | Used to adjust |
|---|---|---|
| Impressions delivered | OOH vendor API / ad platform | Traffic weight in reach_score |
| Click-through rate (CTR) | Ad platform analytics | Engagement weight in reach_score |
| Video completion rate | Platform analytics | Hook effectiveness flag |
| Conversion lift | CRM / promo code tracking | product_fit_score |
| Brand recall lift | Survey / brand tracker | Identity archetype accuracy |

### Re-run trigger logic

```
IF zone.ctr < campaign_threshold
OR zone.impressions < expected_impressions
OR zone.conversion_lift < minimum_viable_lift:

    → Re-score zone              (Phase 2)
    → Regenerate strategy        (Phase 3)
    → Regenerate creative assets (Phase 4)
    → Reallocate budget away from underperformer
    → Log iteration in feedback history
```

Feedback loop cadence: weekly for long campaigns, daily for performance-heavy digital campaigns.

---

## Per-Zone Deliverable Package

Every zone produces one complete deliverable package:

| Component | Source phase | Format |
|---|---|---|
| Budget allocation | Phase 2 | JSON + dashboard card |
| Audience brief | Phase 2 | Structured profile |
| Identity archetype | Phase 2 | Text |
| Primary tension | Phase 3 | Plain text |
| Product bridge | Phase 3 | Plain text |
| Campaign tone + visual direction | Phase 3 | Brief document |
| Primary hook + variants | Phase 3 | Text list |
| Messaging do / don't | Phase 3 | Guardrail list |
| Slogan variants | Phase 4 | Text list |
| Visual / logo brief | Phase 4 | Prompt + metadata JSON |
| Video scripts (15s / 30s / 60s) | Phase 4 | Scene-by-scene |

---

## Tech Stack

| Layer | Recommended tool | Purpose |
|---|---|---|
| Social scraping | Apify `instagram-search-scraper` | Geo post density + engagement |
| Demographics | Apify `census-data-scraper` | Population and income signals |
| Map rendering | Mapbox GL JS | Heatmap + placement overlay |
| Agent intelligence | Claude `claude-sonnet-4-6` | All three agent phases |
| Image generation | DALL-E 3 / Midjourney v6 | Visual and logo assets |
| Video generation (short) | Sora / Runway ML Gen-3 | 15s–30s spots |
| Video generation (long) | Runway ML | 60s brand films |
| Social cut-downs | Opus Clip | Auto-clips from master |
| Avatar / testimonial video | HeyGen | Talking-head format |
| Dashboard UI | React + Mapbox GL JS | Campaign overview |
| Pipeline orchestration | Node.js or Python | Phase runner + API calls |
| Data storage | JSON or PostgreSQL | Zone data + campaign history |

---

## Build Order

| Phase | Priority | Effort estimate | Dependency |
|---|---|---|---|
| Phase 1 — Scraper setup | P0 | 1–2 days | None |
| Phase 1 — Mapbox heatmap | P0 | 1–2 days | Scraper output |
| Phase 2 — Market Manager Agent | P0 | 2–3 days | Phase 1 complete |
| Phase 3 — Strategy Planner Agent | P1 | 2–3 days | Phase 2 complete |
| Phase 4 — Slogan + visual brief | P1 | 1–2 days | Phase 3 complete |
| Phase 4 — Video script generation | P2 | 1 day | Phase 3 complete |
| Phase 4 — Video rendering pipeline | P2 | 3–5 days | Phase 4 scripts |
| Dashboard UI | P2 | 3–4 days | Phase 2 + 3 schemas |
| Performance feedback loop | P3 | 3–5 days | All phases live |

---

## Configuration Reference

These values are set once at campaign setup and remain constant throughout the run:

| Config key | Description | Default |
|---|---|---|
| `total_budget` | Total campaign budget in USD | Required |
| `target_region` | City, metro area, or bounding box | Required |
| `product_brief` | Product name, promise, personality | Required |
| `target_customer` | Plain-language ideal customer description | Required |
| `reach_score_weights` | Weights for density / engagement / traffic | 0.35 / 0.30 / 0.35 |
| `max_zone_share` | Max % of budget one zone can receive | 40% |
| `min_zones` | Minimum zones to fund | 3 |
| `feedback_cadence` | How often the loop re-runs | Weekly |
| `video_cut_lengths` | Script lengths to generate | 15s, 30s, 60s |
| `image_gen_tool` | Preferred image generation tool | Midjourney v6 |

---

## Core Design Principles

**1. Zone-first, not product-first.**
Every output is keyed to a specific geographic zone. The same product generates different hooks, slogans, and creative for different zones because the people are different. The system never produces one universal message.

**2. Hooks lead with tension, not product.**
The creative agent is explicitly instructed never to open with the product name or a feature claim. The felt tension comes first. The product is the response, not the subject.

**3. Identity over demographics.**
Age and income are inputs. The archetype — who this person sees themselves as and wants to become — is what drives messaging. Two zones with identical demographics get different campaigns if their identity signals differ.

**4. Agents reason, they don't template.**
Each Claude agent receives full context — product brief, zone data, audience profile, prior phase outputs — and reasons through the chain rather than filling slots in a fixed template. This handles edge-case zones that don't fit a clean archetype.

**5. Performance closes the loop.**
The system is not a one-time run. Budget reallocation, hook regeneration, and creative refresh are triggered automatically when zones underperform. The engine is self-improving over time.

**6. Separation of concerns across phases.**
Phase 1 knows nothing about messaging. Phase 2 knows nothing about creative. Phase 3 knows nothing about budget. Each phase has one job and passes a clean schema to the next — making every phase independently testable, replaceable, and improvable.

---

*Generic geo-targeted marketing campaign engine — applicable to any product, service, or brand.*