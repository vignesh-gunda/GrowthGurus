export async function runKalibrJson<T>(_args: {
  system: string;
  input: unknown;
}): Promise<T> {
  const apiKey = process.env.KALIBR_API_KEY;
  const tenantId = process.env.KALIBR_TENANT_ID;

  if (!apiKey || !tenantId) {
    throw new Error("Kalibr credentials are not configured.");
  }

  throw new Error(
    "Kalibr orchestration is not wired yet because this repo does not include the Kalibr API contract or endpoint shape."
  );
}
