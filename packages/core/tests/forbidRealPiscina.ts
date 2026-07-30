import { vi } from "vitest"

export class ForbiddenPiscina {
  constructor(..._args: unknown[]) {
    throw new Error(
      "Настоящий Piscina запрещён в pnpm test; передайте mock worker pool"
    )
  }
}

vi.mock("piscina", async (importOriginal) => {
  const original = await importOriginal<typeof import("piscina")>()
  return { ...original, default: ForbiddenPiscina }
})
