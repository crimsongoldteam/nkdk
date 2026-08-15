import { describe, expect, it } from "vitest"
import { withMultipleValuesUserVisible } from "./__fixtures__/withMultipleValues"
import { withSingleValueUserVisible } from "./__fixtures__/withSingleValue"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../tests/readAndParseXMLFile"
import { importUserVisibleFromXML } from "./fromXML"
import { UserVisible, UserVisibleXML } from "./types"
import { yamlMappingKeyTagAt } from "@nkdk/runtime"
import { createRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { importPropertiesFromXMLToYAML } from "../../ruleRuntime"

describe("importUserVisibleFromXML", () => {
  it("should import Use from XML", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withMultipleValues.xml")

    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, xml.UserVisible)

    expect(result).toEqual(withMultipleValuesUserVisible)
  })

  it("should import Use from XML with empty values", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withEmptyValues.xml")

    const expectedResult: UserVisible = {
      common: false,
      values: [],
    }

    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, xml.UserVisible)

    expect(result).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in Use XML", () => {
    const xml = readAndParseXMLFile<{ UserVisible: UserVisibleXML }>("userVisible/withSingleValue.xml")

    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, xml.UserVisible)

    expect(result).toEqual(withSingleValueUserVisible)
  })

  it("skips UserVisible values with unsupported boolean text", () => {
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, {
      "xr:Value": { _name: "Role.Администратор", "#text": "maybe" as any },
    })

    expect(result).toEqual({ common: false, values: [] })
  })

  it("preserves Role-prefixed names and UUID names exactly", () => {
    const result = importUserVisibleFromXML(mockContextFromXML(), mockRule, {
      "xr:Common": "false",
      "xr:Value": [
        { _name: "Role.ПолныеПрава", "#text": "true" },
        { _name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", "#text": "true" },
      ],
    })

    expect(result).toEqual({
      common: false,
      values: [
        { name: "Role.ПолныеПрава", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true },
      ],
    })
  })

  it("помечает UUID-ключ роли через !xml/reference", () => {
    const uuid = "6537a19c-3357-46a2-96a6-1fe4619ddbc8"
    const yaml = importBrokenRoles([
      { _name: "Role.Кассир", "#text": true },
      { _name: uuid, "#text": false },
    ])

    expect(yaml.Использование.Роли).toEqual({ Кассир: "Истина", [uuid]: "Ложь" })
    expect(yamlMappingKeyTagAt(yaml.Использование.Роли, uuid)).toBe("xml/reference")
  })

  it("помечает пустой ключ роли через !xml/reference", () => {
    const yaml = importBrokenRoles([
      { _name: "", "#text": false },
      { _name: "Role.Кассир", "#text": true },
    ])

    expect(yaml.Использование.Роли).toEqual({ "": "Ложь", Кассир: "Истина" })
    expect(yamlMappingKeyTagAt(yaml.Использование.Роли, "")).toBe("xml/reference")
  })
})

function importBrokenRoles(
  values: Array<{ _name: string; "#text": boolean }>,
): { Использование: { Роли: Record<string, string> } } {
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  return importPropertiesFromXMLToYAML({
    context,
    rule: {
      itemType: "UserVisibleBrokenReferenceProbe",
      properties: {
        use: { type: "UserVisible", xml: "Use", yaml: "Использование" },
      },
    } as MetadataItemRule,
    sources: [{
      context,
      xml: { Use: { "xr:Common": true, "xr:Value": values } },
    }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    execution: createRuleRegistrySet(metadataRules).execution,
  }) as { Использование: { Роли: Record<string, string> } }
}
