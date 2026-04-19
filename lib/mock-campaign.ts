import type { FeatureCollection, Point } from "geojson";
import instagramData from "@/data/instagram.json";

export type SupportedPlatform = "instagram" | "google_maps" | "tiktok" | "x";
export type SupportedRegion = "San Francisco" | "Los Angeles" | "New York City" | "Miami";

export type CampaignOnboardingInput = {
  productName: string;
  productCategory: string;
  targetRegion: SupportedRegion;
  targetCustomer: string;
  corePromise: string;
  brandPersonality: string;
  totalBudget: number;
  platforms: SupportedPlatform[];
};

export type Placement = {
  id: string;
  zoneId: string;
  label: string;
  lat: number;
  lng: number;
  placementType: string;
  estDailyImpressions: number;
  peakHours: string[];
};

export type RawSocialResult = {
  actor: string;
  searchSource: SupportedPlatform;
  searchTerm: string;
  locationId: string;
  locationName: string;
  latitude: number;
  longitude: number;
  postsCount: number;
  avgEngagement: number;
  topHashtags: string[];
  sourceNote: string;
};

export type ZoneSummary = {
  zoneId: string;
  label: string;
  avgEngagement: number;
  postCountDaily: number;
  dominantPlatform: SupportedPlatform;
};

export type GeneratedCampaign = {
  region: SupportedRegion;
  geojson: FeatureCollection<Point>;
  placements: Placement[];
  rawSocialResults: RawSocialResult[];
  zoneSummaries: ZoneSummary[];
  initialView: {
    center: [number, number];
    zoom: number;
  };
};

export type InstagramEngagementRecord = {
  latitude: number;
  longitude: number;
  "comment date": string;
  comment: string;
  likes: number;
  hashtags: string[];
};

export const regionOptions: SupportedRegion[] = ["San Francisco", "Los Angeles", "New York City", "Miami"];

export const platformOptions: Array<{ id: SupportedPlatform; label: string }> = [
  { id: "instagram", label: "Instagram place search" },
  { id: "google_maps", label: "Google Maps business clusters" },
  { id: "tiktok", label: "TikTok location tags" },
  { id: "x", label: "X geocoded activity" }
];

export const defaultCampaignInput: CampaignOnboardingInput = {
  productName: "Red Bull",
  productCategory: "Energy drink",
  targetRegion: "San Francisco",
  targetCustomer:
    "Young professionals, creators, athletes, and nightlife-heavy urban consumers moving through San Francisco with high energy demands.",
  corePromise: "Keeps people energized, sharp, and socially present across long city days.",
  brandPersonality: "Bold, kinetic, adventurous, and urban.",
  totalBudget: 125000,
  platforms: ["instagram"]
};

const storageKey = "markagent.campaign";

export function storeCampaignInput(input: CampaignOnboardingInput) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(input));
}

export function loadCampaignInput(): CampaignOnboardingInput | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as CampaignOnboardingInput;
  } catch {
    return null;
  }
}

const regionPresets: Record<
  SupportedRegion,
  {
    center: [number, number];
    zoom: number;
    places: Array<{
      locationId: string;
      locationName: string;
      lat: number;
      lng: number;
      zoneId: string;
      placementType: string;
      placementLabel: string;
      peakHours: string[];
    }>;
  }
> = {
  "San Francisco": {
    center: [-122.4313, 37.7739],
    zoom: 11.2,
    places: [
      {
        locationId: "sf-mission-001",
        locationName: "Mission District",
        lat: 37.7599,
        lng: -122.4148,
        zoneId: "zone-mission",
        placementType: "Wallscape",
        placementLabel: "Mission District Wallscape",
        peakHours: ["11 AM-2 PM", "6-10 PM"]
      },
      {
        locationId: "sf-soma-002",
        locationName: "SoMa",
        lat: 37.7786,
        lng: -122.4059,
        zoneId: "zone-soma",
        placementType: "Digital screen",
        placementLabel: "SoMa Digital Screen",
        peakHours: ["8-10 AM", "5-8 PM"]
      },
      {
        locationId: "sf-marina-003",
        locationName: "Marina + Waterfront",
        lat: 37.8045,
        lng: -122.4376,
        zoneId: "zone-marina",
        placementType: "Transit shelter",
        placementLabel: "Marina Waterfront Shelter",
        peakHours: ["1-5 PM", "7-10 PM"]
      }
    ]
  },
  "Los Angeles": {
    center: [-118.258, 34.049],
    zoom: 10.9,
    places: [
      {
        locationId: "la-dtla-001",
        locationName: "DTLA Core",
        lat: 34.0507,
        lng: -118.2478,
        zoneId: "zone-dtla",
        placementType: "Digital screen",
        placementLabel: "DTLA Core Digital Screen",
        peakHours: ["7-10 AM", "4-8 PM"]
      },
      {
        locationId: "la-arts-002",
        locationName: "Arts District",
        lat: 34.0412,
        lng: -118.2328,
        zoneId: "zone-arts",
        placementType: "Transit shelter",
        placementLabel: "Arts District Shelter",
        peakHours: ["11 AM-2 PM", "6-9 PM"]
      },
      {
        locationId: "la-samo-003",
        locationName: "Santa Monica Promenade",
        lat: 34.0155,
        lng: -118.4961,
        zoneId: "zone-santa-monica",
        placementType: "Billboard",
        placementLabel: "Santa Monica Promenade Billboard",
        peakHours: ["1-5 PM", "6-10 PM"]
      }
    ]
  },
  "New York City": {
    center: [-73.9857, 40.7484],
    zoom: 11,
    places: [
      {
        locationId: "nyc-soho-001",
        locationName: "SoHo",
        lat: 40.7237,
        lng: -74.0006,
        zoneId: "zone-soho",
        placementType: "Digital screen",
        placementLabel: "SoHo Retail Screen",
        peakHours: ["11 AM-2 PM", "5-8 PM"]
      },
      {
        locationId: "nyc-wburg-002",
        locationName: "Williamsburg",
        lat: 40.7181,
        lng: -73.9571,
        zoneId: "zone-williamsburg",
        placementType: "Wallscape",
        placementLabel: "Williamsburg Wallscape",
        peakHours: ["10 AM-1 PM", "6-10 PM"]
      },
      {
        locationId: "nyc-flatiron-003",
        locationName: "Flatiron",
        lat: 40.7411,
        lng: -73.9897,
        zoneId: "zone-flatiron",
        placementType: "Transit shelter",
        placementLabel: "Flatiron Transit Shelter",
        peakHours: ["8-10 AM", "4-7 PM"]
      }
    ]
  },
  Miami: {
    center: [-80.1918, 25.7617],
    zoom: 11,
    places: [
      {
        locationId: "mia-wynwood-001",
        locationName: "Wynwood",
        lat: 25.8004,
        lng: -80.1998,
        zoneId: "zone-wynwood",
        placementType: "Mural wall",
        placementLabel: "Wynwood Mural Wall",
        peakHours: ["12-4 PM", "7-11 PM"]
      },
      {
        locationId: "mia-brickell-002",
        locationName: "Brickell",
        lat: 25.7651,
        lng: -80.1937,
        zoneId: "zone-brickell",
        placementType: "Digital screen",
        placementLabel: "Brickell Digital Screen",
        peakHours: ["7-10 AM", "4-8 PM"]
      },
      {
        locationId: "mia-sobe-003",
        locationName: "South Beach",
        lat: 25.7907,
        lng: -80.13,
        zoneId: "zone-south-beach",
        placementType: "Billboard",
        placementLabel: "South Beach Boulevard Billboard",
        peakHours: ["1-6 PM", "8 PM-12 AM"]
      }
    ]
  }
};

const actorLabels: Record<SupportedPlatform, string> = {
  instagram: "apify/instagram-search-scraper",
  google_maps: "google-maps-cluster-mock",
  tiktok: "tiktok-location-mock",
  x: "x-geocode-mock"
};

const hashtagPresets: Record<SupportedPlatform, string[]> = {
  instagram: ["#afterwork", "#fitcheck", "#citynights", "#coffeerun"],
  google_maps: ["#foottraffic", "#popularnow", "#retailcluster", "#commuterflow"],
  tiktok: ["#dayinmylife", "#cityspots", "#weekendplans", "#foodstop"],
  x: ["#rushhour", "#popup", "#trendingnow", "#localbuzz"]
};

export function generateMockCampaign(input: CampaignOnboardingInput): GeneratedCampaign {
  if (input.targetRegion === "San Francisco") {
    return buildSanFranciscoCampaign(input);
  }

  const preset = regionPresets[input.targetRegion];
  const activePlatforms: SupportedPlatform[] =
    input.platforms.length > 0 ? input.platforms : ["instagram"];

  const rawSocialResults = preset.places.flatMap((place, placeIndex) =>
    activePlatforms.map((platform, platformIndex) => {
      const baseVolume = 140 + placeIndex * 38 + platformIndex * 21;
      const baseEngagement = 52 + placeIndex * 14 + platformIndex * 8;

      return {
        actor: actorLabels[platform],
        searchSource: platform,
        searchTerm: `${input.productCategory} ${input.targetRegion}`.toLowerCase(),
        locationId: `${place.locationId}-${platform}`,
        locationName: place.locationName,
        latitude: place.lat,
        longitude: place.lng,
        postsCount: baseVolume,
        avgEngagement: baseEngagement,
        topHashtags: hashtagPresets[platform],
        sourceNote: `Mocked to match a later normalization step for ${actorLabels[platform]}.`
      };
    })
  );

  const features = rawSocialResults.flatMap((result, index) =>
    createPointCluster({
      centerLat: result.latitude,
      centerLng: result.longitude,
      weightBase: result.avgEngagement,
      platform: result.searchSource,
      locationId: result.locationId,
      zoneId: preset.places[index % preset.places.length].zoneId,
      productName: input.productName,
      count: 5
    })
  );

  const placements = preset.places.map((place, index) => ({
    id: place.locationId,
    zoneId: place.zoneId,
    label: place.placementLabel,
    lat: place.lat,
    lng: place.lng,
    placementType: place.placementType,
    estDailyImpressions: 22000 + index * 16000 + activePlatforms.length * 3500,
    peakHours: place.peakHours
  }));

  const zoneSummaries = preset.places.map((place, index) => {
    const zoneResults = rawSocialResults.filter((result) =>
      result.locationId.startsWith(place.locationId)
    );
    const postCountDaily = zoneResults.reduce((sum, item) => sum + item.postsCount, 0);
    const avgEngagement =
      zoneResults.reduce((sum, item) => sum + item.avgEngagement, 0) / zoneResults.length;

    return {
      zoneId: place.zoneId,
      label: place.locationName,
      avgEngagement: Math.round(avgEngagement),
      postCountDaily,
      dominantPlatform: activePlatforms[index % activePlatforms.length]
    };
  });

  return {
    region: input.targetRegion,
    geojson: {
      type: "FeatureCollection",
      features
    },
    placements,
    rawSocialResults,
    zoneSummaries,
    initialView: {
      center: preset.center,
      zoom: preset.zoom
    }
  };
}

function buildSanFranciscoCampaign(input: CampaignOnboardingInput): GeneratedCampaign {
  return buildCampaignFromInstagramRecords(input, instagramData as InstagramEngagementRecord[], "instagram_live_dataset");
}

export function buildCampaignFromInstagramRecords(
  input: CampaignOnboardingInput,
  records: InstagramEngagementRecord[],
  source = "instagram_live_dataset"
): GeneratedCampaign {
  const preset = regionPresets["San Francisco"];

  const zoneDefinitions = [
    {
      zoneId: "zone-mission",
      label: "Mission District",
      placementType: "Wallscape",
      placementLabel: "Mission District Wallscape",
      peakHours: ["11 AM-2 PM", "6-10 PM"],
      match: (record: InstagramEngagementRecord) => record.latitude < 37.77 && record.longitude > -122.43
    },
    {
      zoneId: "zone-soma",
      label: "SoMa + Downtown",
      placementType: "Digital screen",
      placementLabel: "SoMa Digital Screen",
      peakHours: ["8-10 AM", "5-8 PM"],
      match: (record: InstagramEngagementRecord) =>
        record.latitude >= 37.77 && record.longitude > -122.43 && record.longitude < -122.39
    },
    {
      zoneId: "zone-marina",
      label: "Marina + Waterfront",
      placementType: "Transit shelter",
      placementLabel: "Marina Waterfront Shelter",
      peakHours: ["1-5 PM", "7-10 PM"],
      match: (_record: InstagramEngagementRecord) => true
    }
  ];

  const zonedRecords = records.map((record) => {
    const matchedZone =
      zoneDefinitions.find((zone) => zone.match(record)) ?? zoneDefinitions[zoneDefinitions.length - 1];

    return {
      ...record,
      zoneId: matchedZone.zoneId,
      zoneLabel: matchedZone.label
    };
  });

  const geojson: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: zonedRecords.map((record, index) => ({
      type: "Feature",
      properties: {
        weight: Math.min(100, Math.round(record.likes / 50)),
        engagement: record.likes,
        platform: "instagram",
        location_id: `sf-instagram-${index + 1}`,
        zone_id: record.zoneId,
        zone_label: record.zoneLabel,
        source,
        campaign: input.productName,
        hashtags: record.hashtags,
        comment: record.comment,
        comment_date: record["comment date"]
      },
      geometry: {
        type: "Point",
        coordinates: [record.longitude, record.latitude]
      }
    }))
  };

  const placements: Placement[] = zoneDefinitions.map((zone) => {
    const zoneRecords = zonedRecords.filter((record) => record.zoneId === zone.zoneId);
    const center = averageCoordinates(zoneRecords, preset.center);

    return {
      id: zone.zoneId,
      zoneId: zone.zoneId,
      label: zone.placementLabel,
      lat: center.lat,
      lng: center.lng,
      placementType: zone.placementType,
      estDailyImpressions: Math.round(zoneRecords.reduce((sum, record) => sum + record.likes, 0) * 3.2),
      peakHours: zone.peakHours
    };
  });

  const rawSocialResults = zoneDefinitions.map((zone) => {
    const zoneRecords = zonedRecords.filter((record) => record.zoneId === zone.zoneId);

    return {
      actor: "apify/instagram-search-scraper",
      searchSource: "instagram" as const,
      searchTerm: `${input.productName} ${input.targetRegion}`.toLowerCase(),
      locationId: zone.zoneId,
      locationName: zone.label,
      latitude: averageCoordinates(zoneRecords, preset.center).lat,
      longitude: averageCoordinates(zoneRecords, preset.center).lng,
      postsCount: zoneRecords.length,
      avgEngagement: Math.round(zoneRecords.reduce((sum, record) => sum + record.likes, 0) / Math.max(zoneRecords.length, 1)),
      topHashtags: topHashtags(zoneRecords),
      sourceNote:
        source === "apify_instagram_refresh"
          ? "Derived from a fresh Apify Instagram scraper run for San Francisco."
          : "Derived from live San Francisco Instagram engagement data."
    };
  });

  const zoneSummaries = zoneDefinitions.map((zone, index) => {
    const zoneRecords = zonedRecords.filter((record) => record.zoneId === zone.zoneId);
    const avgEngagement = Math.round(
      zoneRecords.reduce((sum, record) => sum + record.likes, 0) / Math.max(zoneRecords.length, 1)
    );

    return {
      zoneId: zone.zoneId,
      label: zone.label,
      avgEngagement,
      postCountDaily: zoneRecords.length,
      dominantPlatform: "instagram" as const
    };
  });

  return {
    region: "San Francisco",
    geojson,
    placements,
    rawSocialResults,
    zoneSummaries,
    initialView: {
      center: preset.center,
      zoom: preset.zoom
    }
  };
}

function averageCoordinates(
  records: InstagramEngagementRecord[],
  fallbackCenter: [number, number]
) {
  if (records.length === 0) {
    return { lat: fallbackCenter[1], lng: fallbackCenter[0] };
  }

  const totals = records.reduce(
    (sum, record) => ({
      lat: sum.lat + record.latitude,
      lng: sum.lng + record.longitude
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: totals.lat / records.length,
    lng: totals.lng / records.length
  };
}

function topHashtags(records: InstagramEngagementRecord[]) {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    record.hashtags.forEach((hashtag) => {
      counts.set(hashtag, (counts.get(hashtag) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([hashtag]) => hashtag);
}

export function getBundledInstagramRecords() {
  return instagramData as InstagramEngagementRecord[];
}

function createPointCluster({
  centerLat,
  centerLng,
  weightBase,
  platform,
  locationId,
  zoneId,
  productName,
  count
}: {
  centerLat: number;
  centerLng: number;
  weightBase: number;
  platform: SupportedPlatform;
  locationId: string;
  zoneId: string;
  productName: string;
  count: number;
}): FeatureCollection<Point>["features"] {
  return Array.from({ length: count }, (_, offset) => ({
    type: "Feature",
    properties: {
      weight: weightBase + offset * 4,
      engagement: weightBase + offset * 7,
      platform,
      location_id: locationId,
      zone_id: zoneId,
      zone_label: zoneId,
      source: "mock_onboarding_preview",
      campaign: productName,
      comment: "Mock campaign point",
      comment_date: ""
    },
    geometry: {
      type: "Point",
      coordinates: [
        centerLng + coordinateOffset(offset, 0.008),
        centerLat + coordinateOffset(offset + 1, 0.006)
      ]
    }
  }));
}

function coordinateOffset(seed: number, magnitude: number) {
  const direction = seed % 2 === 0 ? 1 : -1;
  return direction * magnitude * ((seed % 3) + 1) * 0.35;
}
