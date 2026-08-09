import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { structuralYamlValue } from "./structuralYamlValue"

describe("structuralYamlValue", () => {
  it("передаёт !xml в JSON Schema обычной строкой", () => {
    const emptyTag = parseMetadataYaml("Поле: !xml").data
    const nonEmptyTag = parseMetadataYaml("Поле: !xml uuid-value").data
    const emptyString = parseMetadataYaml('Поле: ""').data

    expect(structuralYamlValue(emptyTag)).toEqual({ Поле: "!xml" })
    expect(structuralYamlValue(nonEmptyTag)).toEqual({ Поле: "!xml uuid-value" })
    expect(structuralYamlValue(emptyString)).toEqual({ Поле: "" })
    expect(emptyTag).toEqual({ Поле: "!xml" })
  })
})
