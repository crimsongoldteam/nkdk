import { vi } from "vitest"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "a87fba31-32d9-4b41-be05-e0141f6a803d"),
}))
