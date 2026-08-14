import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "@nkdk/runtime"
import { structuralYamlValue } from "./structuralYamlValue"

describe("structuralYamlValue", () => {
  it("передаёт классифицированные XML-теги в JSON Schema обычной строкой", () => {
    const emptyTag = parseMetadataYaml("Поле: !xml/present").data
    const nonEmptyTag = parseMetadataYaml("Поле: !xml/reference uuid-value").data
    const emptyString = parseMetadataYaml('Поле: ""').data

    expect(structuralYamlValue(emptyTag)).toEqual({ Поле: "!xml/present" })
    expect(structuralYamlValue(nonEmptyTag)).toEqual({ Поле: "!xml/reference uuid-value" })
    expect(structuralYamlValue(emptyString)).toEqual({ Поле: "" })
    expect(emptyTag).toEqual({ Поле: "!xml/present" })
  })
})
