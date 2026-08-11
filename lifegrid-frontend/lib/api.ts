// All client → server writes go through here. Never call Firestore write ops from components.

export const USE_MOCKS = !process.env.NEXT_PUBLIC_API_URL;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/** Start a new mission. Returns { mission_id }. Falls back to a local demo ID when backend is absent. */
export async function createMission(
  userId: string,
  goal: string
): Promise<{ mission_id: string }> {
  if (USE_MOCKS) {
    // Simulate a brief network delay so loading states are visible
    await new Promise((r) => setTimeout(r, 600));
    return { mission_id: "demo-" + Date.now() };
  }
  try {
    const res = await fetch(`${API_URL}/missions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, goal }),
    });
    if (!res.ok) {
      throw new ApiError(`Server responded ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<{ mission_id: string }>;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Could not reach the LifeGrid backend. Please try again.");
  }
}

/** Send an approve / reject decision for a pending approval. */
export async function decideApproval(
  approvalId: string,
  approved: boolean
): Promise<void> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 400));
    return;
  }
  try {
    const res = await fetch(`${API_URL}/approvals/${approvalId}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (!res.ok) {
      throw new ApiError(`Server responded ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("Could not submit your decision. Please try again.");
  }
}
