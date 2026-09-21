import { describe, expect, it, vi } from "vitest";
import { userExists } from "./userExists";
import { apiGetUser } from "./api/usersApi";

vi.mock("./api/usersApi", () => ({
  apiGetUser: vi.fn(),
}));

const mockedApiGetUser = vi.mocked(apiGetUser);

describe("userExists", () => {
  it("returns true when apiGetUser resolves", async () => {
    mockedApiGetUser.mockResolvedValue({ id: "user-1", username: "alice", createdAt: new Date().toISOString() });

    await expect(userExists("user-1")).resolves.toBe(true);
  });

  it("returns false when apiGetUser rejects, rather than throwing", async () => {
    mockedApiGetUser.mockRejectedValue(new Error('No user found with id "nope".'));

    await expect(userExists("nope")).resolves.toBe(false);
  });
});
