import type { User } from "../types";

/**
 * In-memory fake backend — no real network. Simulates latency so
 * loading states are visible; explicitly out of scope per the spec to wire
 * up a real backend.
 */
const store = new Map<string, User>();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiCreateUser(username: string): Promise<User> {
  await delay(300);
  const user: User = {
    id: crypto.randomUUID(),
    username,
    createdAt: new Date().toISOString(),
  };
  store.set(user.id, user);
  return user;
}

export async function apiGetUser(id: string): Promise<User> {
  await delay(300);
  const user = store.get(id);
  if (!user) {
    throw new Error(`No user found with id "${id}".`);
  }
  return user;
}
