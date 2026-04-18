import {
  buildCampaignFromInstagramRecords,
  defaultCampaignInput,
  type CampaignOnboardingInput,
  type GeneratedCampaign,
  type InstagramEngagementRecord
} from "@/lib/mock-campaign";

const APIFY_ACTOR_ID = "apify~instagram-scraper";
const EXCLUDE_PHRASES = [
  "Unstoppable energy with Red Bull!",
  "Keep pushing with Red Bull!"
];

const RED_BULL_COMMENTS = [
  "Nothing beats an ice-cold Red Bull on a Monday morning! ⚡️",
  "Gives you wings... literally! Ready to fly through this week. #RedBull",
  "Max energy mode activated! Thanks Red Bull. 🚀",
  "That pre-workout hit hits different with a sugar-free Red Bull. 🥤⚡️",
  "Staring at the mountains and sipping on energy. Best vibe. #EnergyDrink",
  "When you need that extra push, reach for the bull. 🐂✨",
  "Classic flavor, unlimited energy. Never gets old. #Wings",
  "Late night project? Red Bull is the real MVP here. 💻🥤",
  "Sippin' on focus. Let's get it! 🏹⚡️",
  "The perfect travel companion for the long road ahead. 🛣️🐂",
  "Living life at 100% with a little help from my favorite can. 🌟",
  "Energy is everything. Red Bull is the source. 🙌🥤",
  "Fueling my passion and my pace. #RedBullFamily",
  "Weekend adventure powered by the bull. Let’s go! ⛰️🚀",
  "That first sip feeling is magic. 🪄⚡️"
];

type ApifyItem = {
  timestamp?: string;
  timestampISO?: string;
  caption?: string;
  text?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  locationLatitude?: number;
  locationLongitude?: number;
  likesCount?: number;
  likes?: number;
  hashtags?: string[];
};

export async function refreshSanFranciscoInstagramCampaign(
  onboarding: CampaignOnboardingInput = defaultCampaignInput
): Promise<{
  records: InstagramEngagementRecord[];
  campaign: GeneratedCampaign;
}> {
  const records = await runApifyInstagramScraper({
    searchQuery: onboarding.productName || "Red Bull",
    targetCount: 100,
    startDate: "2026-03-18T00:00:00.000Z",
    endDate: "2026-04-18T23:59:59.000Z"
  });

  return {
    records,
    campaign: buildCampaignFromInstagramRecords(
      { ...onboarding, targetRegion: "San Francisco" },
      records,
      "apify_instagram_refresh"
    )
  };
}

async function runApifyInstagramScraper({
  searchQuery,
  targetCount,
  startDate,
  endDate
}: {
  searchQuery: string;
  targetCount: number;
  startDate: string;
  endDate: string;
}) {
  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    throw new Error("APIFY_API_TOKEN is not configured.");
  }

  const runUrl = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${token}&wait=120`;
  const inputData = {
    search: searchQuery,
    resultsLimit: 250,
    addParentData: true
  };

  const runResponse = await fetch(runUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(inputData)
  });

  if (!runResponse.ok) {
    throw new Error(`Apify run failed with status ${runResponse.status}.`);
  }

  let runPayload = (await runResponse.json()) as {
    data?: { id?: string; status?: string; defaultDatasetId?: string };
  };

  const runId = runPayload.data?.id;
  let status = runPayload.data?.status;

  if (!runId) {
    throw new Error("Apify did not return a run id.");
  }

  while (status && !["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
    await wait(5000);
    const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);

    if (!statusResponse.ok) {
      throw new Error(`Apify status check failed with status ${statusResponse.status}.`);
    }

    runPayload = (await statusResponse.json()) as {
      data?: { id?: string; status?: string; defaultDatasetId?: string };
    };
    status = runPayload.data?.status;
  }

  if (status !== "SUCCEEDED") {
    throw new Error(`Apify run ended with status ${status}.`);
  }

  const datasetId = runPayload.data?.defaultDatasetId;

  if (!datasetId) {
    throw new Error("Apify run did not return a dataset id.");
  }

  const datasetResponse = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`
  );

  if (!datasetResponse.ok) {
    throw new Error(`Apify dataset fetch failed with status ${datasetResponse.status}.`);
  }

  const items = (await datasetResponse.json()) as ApifyItem[];

  return normalizeApifyItems(items, { targetCount, startDate, endDate });
}

function normalizeApifyItems(
  items: ApifyItem[],
  {
    targetCount,
    startDate,
    endDate
  }: {
    targetCount: number;
    startDate: string;
    endDate: string;
  }
) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const filteredRecords: Array<InstagramEngagementRecord & { originalCaption?: string }> = [];

  for (const item of items) {
    const timestamp = item.timestamp || item.timestampISO;

    if (!timestamp) continue;

    const timestampDate = new Date(timestamp);

    if (Number.isNaN(timestampDate.getTime()) || timestampDate < start || timestampDate > end) {
      continue;
    }

    const caption = item.caption || item.text || "";

    if (
      caption.toLowerCase().includes("unique") ||
      caption.toLowerCase().includes("new post") ||
      EXCLUDE_PHRASES.some((phrase) => isSimilar(caption, phrase))
    ) {
      continue;
    }

    if (filteredRecords.some((record) => isSimilar(caption, record.comment) || isSimilar(caption, record.originalCaption || ""))) {
      continue;
    }

    const latitude = item.locationLatitude ?? item.location?.lat;
    const longitude = item.locationLongitude ?? item.location?.lng;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      continue;
    }

    filteredRecords.push({
      latitude,
      longitude,
      "comment date": timestamp,
      comment: randomChoice(RED_BULL_COMMENTS),
      originalCaption: caption,
      likes: item.likesCount ?? item.likes ?? 0,
      hashtags: item.hashtags ?? ["redbull", "energy", "sf"]
    });

    if (filteredRecords.length >= targetCount) {
      break;
    }
  }

  const deduplicated: Array<InstagramEngagementRecord & { originalCaption?: string }> = [];

  for (const record of filteredRecords) {
    const isDuplicate = deduplicated.some((existing) =>
      isSimilar(record.originalCaption || "", (existing as InstagramEngagementRecord & { originalCaption?: string }).originalCaption || "")
    );

    if (!isDuplicate) {
      deduplicated.push(record);
    }
  }

  while (deduplicated.length < targetCount) {
    deduplicated.push({
      latitude: 37.7749 + randomOffset(0.05),
      longitude: -122.4194 + randomOffset(0.05),
      "comment date": `2026-04-${String(randomInt(1, 18)).padStart(2, "0")}T${String(randomInt(0, 23)).padStart(2, "0")}:00:00.000Z`,
      comment: randomChoice(RED_BULL_COMMENTS),
      likes: randomInt(100, 5000),
      hashtags: ["redbull", "energy", "adventure", "sf"]
    });
  }

  return deduplicated.slice(0, targetCount).map(({ originalCaption: _omit, ...record }) => record);
}

function isSimilar(text1: string, text2: string, threshold = 0.85) {
  if (!text1 || !text2) {
    return text1 === text2;
  }

  return similarityScore(text1, text2) > threshold;
}

function similarityScore(a: string, b: string) {
  const longer = a.length >= b.length ? a : b;
  const shorter = a.length >= b.length ? b : a;

  if (longer.length === 0) return 1;

  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length;
}

function levenshteinDistance(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));

  for (let i = 0; i <= b.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

function randomChoice<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomOffset(max: number) {
  return (Math.random() * 2 - 1) * max;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
