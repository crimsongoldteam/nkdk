import { describe, expect, it } from "vitest"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { EMPTY_XML_TAG_SCHEMA_MARKER } from "../../yaml/scalarTags"
import { structuralYamlValue } from "./structuralYamlValue"

describe("structuralYamlValue", () => {
  it("заменяет только пустой !xml внутренним schema-маркером", () => {
    const emptyTag = parseMetadataYaml("Поле: !xml").data
    const nonEmptyTag = parseMetadataYaml("Поле: !xml uuid-value").data
    const emptyString = parseMetadataYaml('Поле: ""').data

    expect(structuralYamlValue(emptyTag)).toEqual({ Поле: EMPTY_XML_TAG_SCHEMA_MARKER })
    expect(structuralYamlValue(nonEmptyTag)).toEqual({ Поле: "uuid-value" })
    expect(structuralYamlValue(emptyString)).toEqual({ Поле: "" })
    expect(emptyTag).toEqual({ Поле: "" })
  })
})
