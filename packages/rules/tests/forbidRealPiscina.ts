import { vi } from "vitest"

export class ForbiddenPiscina {
  constructor(..._args: unknown[]) {
    throw new Error(
      "Настоящий Piscina запрещён в pnpm test; передайте mock worker pool"
    )
  }
}

const transferableSymbol = Symbol.for("Piscina.transferable")
const valueSymbol = Symbol.for("Piscina.valueOf")

vi.mock("piscina", () => ({
  default: ForbiddenPiscina,
  move: <T>(value: T): T => value,
  transferableSymbol,
  valueSymbol,
}))
