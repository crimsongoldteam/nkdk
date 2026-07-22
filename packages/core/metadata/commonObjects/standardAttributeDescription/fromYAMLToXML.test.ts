import { describe, expect, it } from "vitest"

import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { convertPropertiesFromYAMLToXML } from "../../orchestration/property/fromYAMLToXML"
import type { MetadataItemRule } from "../../orchestration/property/types"

const context: ConfigurationContextWithExportToXML = {
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: { configDumpInfo: new Map(), version: "2.20", itemsTree: [] },
}

describe("StandardAttributeDescriptions direct YAML to XML", () => {
  it("дополняет изменённую YAML-коллекцию каноническими именами", () => {
    const rule = {
      itemType: "TestItem",
      properties: {
        standardAttributes: {
          type: "StandardAttributeDescriptions",
          yaml: "СтандартныеРеквизиты",
          xml: "StandardAttributes",
          standartAttributeNames: {
            Active: "Активность",
            LineNumber: "НомерСтроки",
          },
        },
      },
    } as const satisfies MetadataItemRule

    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: {
        СтандартныеРеквизиты: {
          Активность: { Комментарий: "изменён" },
        },
      },
      rule,
      outputs: [{ key: "owner" }],
    })

    const items = result.outputs.get("owner")?.StandardAttributes as {
      "xr:StandardAttribute": Array<Record<string, unknown>>
    }
    expect(items["xr:StandardAttribute"].map((item) => item._name)).toEqual(["Active", "LineNumber"])
    expect(items["xr:StandardAttribute"][0]?.["xr:Comment"]).toBe("изменён")
  })
})
