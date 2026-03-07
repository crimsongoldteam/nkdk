import { describe, expect, it } from "vitest"
import { full, fullYAML, minimal } from "~/tests/fixtures/configuration/data"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportConfigurationToYAML } from "./toYAML"

describe("exportConfigurationToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportConfigurationToYAML(mockContextToYAML, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full configuration to YAML", () => {
    const result = exportConfigurationToYAML(mockContextToYAML, full)

    expect(result).toBeDefined()
    expect(result?.Имя).toBe(fullYAML.Имя)
    expect(result?.Синоним).toBe(fullYAML.Синоним)
    expect(result?.Комментарий).toBe(fullYAML.Комментарий)
    expect(result?.РежимСовместимости).toBe(fullYAML.РежимСовместимости)
  })

  it("should export minimal configuration to YAML", () => {
    const result = exportConfigurationToYAML(mockContextToYAML, minimal)

    expect(result).toBeDefined()
    expect(result?.Имя).toBe("Конфигурация")
  })
})
