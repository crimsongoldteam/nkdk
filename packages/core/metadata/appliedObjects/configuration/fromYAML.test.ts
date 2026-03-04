import { describe, expect, it } from "vitest"
import { full, fullYAML, minimal, minimalYAML } from "~/tests/fixtures/configuration/data"
import { mockContext } from "~/tests/mockContext"
import { importConfigurationFromYAML } from "./fromYAML"

describe("importConfigurationFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importConfigurationFromYAML(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should import full YAML", () => {
    const result = importConfigurationFromYAML(mockContext, fullYAML)

    expect(result).toBeDefined()
    expect(result?.itemType).toBe("Configuration")
    expect(result?.name).toBe(full.name)
    expect(result?.synonym).toEqual(full.synonym)
    expect(result?.comment).toBe(full.comment)
    expect(result?.vendor).toBe(full.vendor)
    expect(result?.version).toBe(full.version)
    expect(result?.compatibilityMode).toBe(full.compatibilityMode)
  })

  it("should import minimal YAML", () => {
    const result = importConfigurationFromYAML(mockContext, minimalYAML, "Конфигурация")

    expect(result).toBeDefined()
    expect(result?.itemType).toBe("Configuration")
    expect(result?.name).toBe("Конфигурация")
  })
})
