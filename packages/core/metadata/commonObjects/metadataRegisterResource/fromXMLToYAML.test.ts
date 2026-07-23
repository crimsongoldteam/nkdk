import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML } from "../../../tests/directConversion"
import { resourcesYAML } from "./__fixtures__/data"

import "./register"

describe("MetadataRegisterResources XML → YAML", () => {
  it("imports register resources with shared field properties", () => {
    expect(convert().yaml).toEqual({ Значение: resourcesYAML })
  })

  it("exports collection as YAML map keyed by name", () => {
    const result = convert().yaml
    expect(result).toEqual({ Значение: resourcesYAML })
    expect(result).toHaveProperty("Значение.РесурсВсеСвойства.ПолнотекстовыйПоиск", "НеИспользовать")
    expect(result).toHaveProperty(
      "Значение.РесурсВсеСвойства.ПолеИспользованияХраненияВХранилищеДвоичныхДанных",
      "InformationRegister.Регистр.Attribute.ИспользоватьХранилищеДвоичныхДанных"
    )
  })
})

const convert = () =>
  testPropertyFixtureThroughYAML({
    propertyType: "MetadataRegisterResources",
    xmlRootTag: "Resource",
    importMetaUrl: import.meta.url,
    fixture: "resources.xml",
  })
