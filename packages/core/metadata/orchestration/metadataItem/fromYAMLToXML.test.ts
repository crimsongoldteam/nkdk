import { describe, expect, it } from "vitest"

import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../property/types"
import { convertMetadataItemFromYAMLToXML } from "./fromYAMLToXML"

const context = (): ConfigurationContextWithExportToXML => ({
  defaultLanguage: "ru",
  version: "2.20",
  exportToXML: { configDumpInfo: new Map(), version: "2.20", itemsTree: [] },
})

const itemRule = {
  itemType: "CatalogAttribute",
  properties: {
    name: { type: "string", xml: "Name" },
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
} as const satisfies MetadataItemRule

describe("convertMetadataItemFromYAMLToXML", () => {
  it("формирует metadata-item из YAML и имени записи без модели", () => {
    const result = convertMetadataItemFromYAMLToXML({
      context: context(),
      yaml: { Значение: "A" },
      name: "Первый",
      rule: itemRule,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Name: "Первый", Value: "A" })
  })

  it("нормализует yamlInline, оборачивает XMLRoot и сохраняет неизвестный XML", () => {
    const rule = {
      itemType: "CatalogAttribute",
      xsiType: "GeneratedType",
      properties: {
        xmlRoot: {
          type: "XMLRoot",
          container: "Attribute",
          rootAttributes: { _xmlns: "generated" },
          forReferenceOnly: true,
        },
        value: { type: "string", yaml: "Значение", xml: "Value", yamlInline: true },
      },
    } as const satisfies MetadataItemRule
    const result = convertMetadataItemFromYAMLToXML({
      context: context(),
      yaml: "новое",
      rule,
      outputs: [
        {
          key: "owner",
          referenceXML: {
            MetaDataObject: {
              _xmlns: "reference",
              Attribute: { Value: "старое", Unknown: "сохранить" },
            },
          },
        },
      ],
    })

    expect(result.outputs.get("owner")).toEqual({
      MetaDataObject: {
        _xmlns: "reference",
        Attribute: {
          "_xsi:type": "GeneratedType",
          Value: "новое",
          Unknown: "сохранить",
        },
      },
    })
  })
})
