import { describe, expect, it } from "vitest"
import { withMultipleValuesUserVisible } from "./__fixtures__/withMultipleValues"
import { withSingleValueUserVisible } from "./__fixtures__/withSingleValue"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { readXMLFileAsString } from "../../../tests/readAndParseXMLFile"
import { importFromYAML, xmlExport } from "@nkdk/runtime"
import { createRuleRegistrySet, type MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { convertPropertiesFromYAMLToXML } from "../../ruleRuntime"
import { mockContextToXML } from "../../../tests/mockContext"
import { exportUserVisibleToXML } from "./toXML"
import { UserVisible } from "./types"

describe("exportUserVisibleToXML", () => {
  it("should export UserVisible to XML", () => {
    const mockUserVisible = withMultipleValuesUserVisible

    const expectedResult = readXMLFileAsString("userVisible/withMultipleValues.xml").trimEnd()

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should export UserVisible to XML with empty values", () => {
    const mockUserVisible: UserVisible = {
      common: false,
      values: [],
    }

    const expectedResult = `<UserVisible>
	<xr:Common>false</xr:Common>
</UserVisible>`

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportUserVisibleToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should handle single value in UserVisible", () => {
    const mockUserVisible = withSingleValueUserVisible

    const expectedResult = readXMLFileAsString("userVisible/withSingleValue.xml").trimEnd()

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("exports Role-prefixed names and UUID names exactly", () => {
    const mockUserVisible: UserVisible = {
      common: false,
      values: [
        { name: "Role.ПолныеПрава", value: true },
        { name: "b1d9c8b4-d05c-45c7-8db2-abc84e597700", value: true },
      ],
    }

    const exported = exportUserVisibleToXML(mockContext, mockRule, mockUserVisible)
    const xmlString = xmlExport({ UserVisible: exported }, false)

    expect(xmlString).toEqual(`<UserVisible>
	<xr:Common>false</xr:Common>
	<xr:Value name="Role.ПолныеПрава">true</xr:Value>
	<xr:Value name="b1d9c8b4-d05c-45c7-8db2-abc84e597700">true</xr:Value>
</UserVisible>`)
  })

  it("восстанавливает только тегированный UUID-ключ роли", () => {
    const uuid = "6537a19c-3357-46a2-96a6-1fe4619ddbc8"
    const rule = {
      itemType: "UserVisibleBrokenReferenceProbe",
      properties: {
        use: { type: "UserVisible", xml: "Use", yaml: "Использование" },
      },
    } as MetadataItemRule
    const convert = (key: string) => convertPropertiesFromYAMLToXML({
      context: mockContextToXML(),
      yaml: importFromYAML([
        "Использование:",
        "  Роли:",
        `    ${key}: Ложь`,
      ].join("\n")),
      rule,
      outputs: [{ key: "owner" }],
      execution: createRuleRegistrySet(metadataRules).execution,
    }).outputs.get("owner")

    expect(convert(`!xml/reference ${uuid}`)).toEqual({
      Use: {
        "xr:Common": true,
        "xr:Value": [{ _name: uuid, "#text": false }],
      },
    })
    expect(() => convert(uuid)).toThrow("Неизвестный корень")
  })

  it.each([
    ["Ложь", false],
    ["Истина", true],
  ] as const)("восстанавливает тегированный пустой ключ роли со значением %s", (yamlValue, xmlValue) => {
    const rule = {
      itemType: "UserVisibleEmptyBrokenReferenceProbe",
      properties: {
        use: { type: "UserVisible", xml: "Use", yaml: "Использование" },
      },
    } as MetadataItemRule
    const convert = (source: string) => convertPropertiesFromYAMLToXML({
      context: mockContextToXML(),
      yaml: importFromYAML(source),
      rule,
      outputs: [{ key: "owner" }],
      execution: createRuleRegistrySet(metadataRules).execution,
    }).outputs.get("owner")

    expect(convert(`Использование:\n  Роли:\n    !xml/reference "": ${yamlValue}`)).toEqual({
      Use: {
        "xr:Common": true,
        "xr:Value": [{ _name: "", "#text": xmlValue }],
      },
    })
    expect(() => convert('Использование:\n  Роли:\n    "": Ложь')).toThrow()
  })

  it("не теряет обычную роль с именем, похожим на временное", () => {
    const uuid = "6537a19c-3357-46a2-96a6-1fe4619ddbc8"
    const rule = {
      itemType: "UserVisibleTemporaryRoleProbe",
      properties: {
        use: { type: "UserVisible", xml: "Use", yaml: "Использование" },
      },
    } as MetadataItemRule
    const yaml = importFromYAML([
      "Использование:",
      "  Роли:",
      "    __nkdk_broken_role_1: Истина",
      `    !xml/reference ${uuid}: Ложь`,
    ].join("\n"))

    expect(convertPropertiesFromYAMLToXML({
      context: mockContextToXML(),
      yaml,
      rule,
      outputs: [{ key: "owner" }],
      execution: createRuleRegistrySet(metadataRules).execution,
    }).outputs.get("owner")).toEqual({
      Use: {
        "xr:Common": true,
        "xr:Value": [
          { _name: "Role.__nkdk_broken_role_1", "#text": true },
          { _name: uuid, "#text": false },
        ],
      },
    })
  })
})
