import { describe, expect, it } from "vitest"
import { exportToYAML } from "./export"
import { importFromYAML } from "./import"

describe("exportToYAML", () => {
  it("preserves newline-only block scalar values", () => {
    const yaml = exportToYAML({ Пояснение: "\n" })

    expect(importFromYAML<{ Пояснение: string }>(yaml)).toEqual({ Пояснение: "\n" })
    expect(yaml).toContain("Пояснение: |+")
  })

  it("preserves trailing line endings inside block scalar values", () => {
    const value = "Текст\n\n"
    const yaml = exportToYAML({ Пояснение: value })

    expect(importFromYAML<{ Пояснение: string }>(yaml)).toEqual({ Пояснение: value })
  })

  it("does not add a service newline for ordinary YAML documents", () => {
    expect(exportToYAML({ Имя: "Тест" }).endsWith("\n")).toBe(false)
  })
})
