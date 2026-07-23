import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { attributesYAML } from "./__fixtures__/data"

import "./register"

describe("MetadataRegisterAttributes XML → YAML", () => {
  it("imports register attributes with shared field properties", () => {
    expect(convert().yaml).toEqual({ Значение: attributesYAML })
  })

  it("exports collection as YAML map keyed by name", () => {
    const result = convert().yaml
    expect(result).toEqual({ Значение: attributesYAML })
    expect(result).toHaveProperty("Значение.РеквизитВсеСвойства.Индексирование", "Индексировать")
    expect(result).toHaveProperty("Значение.РеквизитВсеСвойства.ПолнотекстовыйПоиск", "НеИспользовать")
  })
})

const convert = () =>
  testPropertyFixtureThroughYAML({
    propertyType: "MetadataRegisterAttributes",
    xmlRootTag: "Attribute",
    importMetaUrl: import.meta.url,
    fixture: "attributes.xml",
  })
