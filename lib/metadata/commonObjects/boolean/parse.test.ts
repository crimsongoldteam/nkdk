import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { parseBoolean } from "./parse"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("parseBoolean", () => {
  it("should return undefined when value is undefined", () => {
    const result = parseBoolean(undefined, configurationSettings)

    expect(result).toBeUndefined()
  })

  it("should return true when value is 'Истина'", () => {
    const result = parseBoolean("Истина", configurationSettings)

    expect(result).toBe(true)
  })

  it("should return false when value is 'Ложь'", () => {
    const result = parseBoolean("Ложь", configurationSettings)

    expect(result).toBe(false)
  })
})
