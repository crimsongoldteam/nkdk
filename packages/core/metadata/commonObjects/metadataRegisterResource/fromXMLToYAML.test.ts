import { describe, expect, it } from "vitest"

import { testPropertyFixtureThroughYAML, testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { resourcesYAML } from "./__fixtures__/data"

import "./register"

const rule = {
  itemType: "MetadataRegisterResourcesProbe",
  properties: {
    value: { type: "MetadataRegisterResources", yaml: "Значение", xml: "Resource" },
  },
} as MetadataItemRule

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

  it("exports empty resource synonym as explicit empty YAML", () => {
    const result = testPropertyFromXMLToYAML({
      rule,
      xml: {
        Resource: {
          Properties: {
            Name: "Ресурс1",
            Synonym: "",
            Type: {
              "v8:Type": "xs:decimal",
              "v8:NumberQualifiers": {
                "v8:Digits": 10,
                "v8:FractionDigits": 0,
                "v8:AllowedSign": "Any",
              },
            },
          },
        },
      },
    })

    expect(result.yaml).toHaveProperty("Значение.Ресурс1.Синоним", "")
  })
})

const convert = () =>
  testPropertyFixtureThroughYAML({
    propertyType: "MetadataRegisterResources",
    xmlRootTag: "Resource",
    importMetaUrl: import.meta.url,
    fixture: "resources.xml",
  })
