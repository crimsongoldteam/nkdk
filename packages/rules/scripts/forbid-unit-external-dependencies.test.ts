import { describe, expect, it, vi } from "vitest"
import { forbiddenUnitDependency } from "../../../scripts/vitest/forbidden-unit-dependency"

describe("unit external dependency guard", () => {
  it("указывает запрещённую зависимость и способ замены", () => {
    expect(() => forbiddenUnitDependency("node:fs.readFileSync")()).toThrow(
      "В unit-тесте запрещена внешняя зависимость node:fs.readFileSync; передайте mock/порт",
    )
  })

  it("не запрещает переданный вызывающим кодом порт", async () => {
    const read = vi.fn(async () => "данные")

    await expect(read()).resolves.toBe("данные")
  })
})
