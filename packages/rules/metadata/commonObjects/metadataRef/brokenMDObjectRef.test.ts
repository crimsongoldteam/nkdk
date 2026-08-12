import { Type } from "typebox"
import { expect, it } from "vitest"

import { importFromYAML, yamlScalarTagAt } from "@nkdk/runtime"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { metadataRules } from "../../composition/metadataRules"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { importPropertiesFromXMLToYAML } from "../../ruleRuntime/property/fromXMLToYAML"
import { convertPropertiesFromYAMLToXML } from "../../ruleRuntime/property/fromYAMLToXML"
import { exportPropertiesToJSONSchema } from "../../ruleRuntime/property/toJSONSchema"
import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext, mockContextFromXML, mockContextToXML } from "../../../tests/mockContext"
import { MetadataSubsystemRules } from "../../appliedObjects/metadataSubsystem/rules"

const UUID = "447e2bd8-fa43-442e-91db-b17634e036d9"

const rule = {
  itemType: "BrokenMDObjectRefProbe",
  properties: {
    content: MetadataSubsystemRules.properties.content,
  },
} satisfies MetadataItemRule

const execution = createRuleRegistrySet(metadataRules).execution

it("round-trips a broken MDObjectRef inside an ordered mixed collection", () => {
  const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
  const yaml = importPropertiesFromXMLToYAML({
    context,
    rule,
    sources: [{
      context,
      xml: {
        Properties: {
          Content: {
            "xr:Item": [
              { "_xsi:type": "xr:MDObjectRef", "#text": "Catalog.Товары" },
              { "_xsi:type": "xr:MDObjectRef", "#text": UUID },
              { "_xsi:type": "xr:MDObjectRef", "#text": "Document.Заказ" },
            ],
          },
        },
      },
    }],
    yamlPath: [],
    rulePath: [],
    collector: createLocalIndexesCollector(),
    execution,
  })

  expect(yaml).toEqual({
    Состав: ["Справочник.Товары", `!xml ${UUID}`, "Документ.Заказ"],
  })
  const content = (yaml as { Состав: unknown[] }).Состав
  expect(yamlScalarTagAt(content, 0)).toBeUndefined()
  expect(yamlScalarTagAt(content, 1)).toBe("xml")
  expect(yamlScalarTagAt(content, 2)).toBeUndefined()

  const exported = convertPropertiesFromYAMLToXML({
    context: {
      defaultLanguage: "ru",
      version: "test",
      exportToXML: { version: "test", itemsTree: [] },
    },
    yaml: importFromYAML(`Состав:\n  - Справочник.Товары\n  - !xml ${UUID}\n  - Документ.Заказ\n`),
    rule,
    outputs: [{ key: "owner" }],
    execution,
  })

  expect(exported.outputs.get("owner")).toEqual({
    Properties: {
      Content: {
        "xr:Item": [
          { "_xsi:type": "xr:MDObjectRef", "#text": "Catalog.Товары" },
          { "_xsi:type": "xr:MDObjectRef", "#text": UUID },
          { "_xsi:type": "xr:MDObjectRef", "#text": "Document.Заказ" },
        ],
      },
    },
  })
})

it("accepts only a canonical UUID in a typed MDObjectRef", () => {
  const carrier = metadataRules.brokenXMLReferenceCarriers.find(
    ({ name }) => name === "metadataRef.mdObjectRefUuid",
  )

  expect(carrier).toBeDefined()
  if (carrier === undefined) return
  const propertyRule = rule.properties.content
  expect(carrier.tryImport({
    rule: propertyRule,
    xmlValue: { "xr:Item": { "_xsi:type": "xr:MDObjectRef", "#text": UUID } },
    yamlValue: [undefined],
  })).toEqual({ yamlValue: [`!xml ${UUID}`], taggedPaths: [[0]] })
  expect(carrier.tryImport({
    rule: propertyRule,
    xmlValue: { "xr:Item": UUID },
    yamlValue: [undefined],
  })).toBeUndefined()
  expect(carrier.tryImport({
    rule: propertyRule,
    xmlValue: { "xr:Item": { "_xsi:type": "xr:MDObjectRef", "#text": UUID.slice(0, -1) } },
    yamlValue: [undefined],
  })).toBeUndefined()
  expect(carrier.tryImport({
    rule: propertyRule,
    xmlValue: { "xr:Item": { "_xsi:type": "xr:MDObjectRef", "#text": "Catalog.Товары" } },
    yamlValue: ["Справочник.Товары"],
  })).toBeUndefined()
})

it("rejects an invalid tagged UUID in the validation graph", () => {
  const properties = exportPropertiesToJSONSchema({
    context: {
      ...mockContext,
      exportToJSONSchema: {
        mode: "inline",
        refs: new Set<string>(),
        validationPropertyRefs: true,
      },
    },
    rule,
    execution,
  })
  const validation = compileValidationSchema({}, Type.Object(properties))

  expect(validation.Check({ Состав: [`!xml ${UUID}`] })).toBe(true)
  expect(validation.Check({ Состав: [`!xml ${UUID}x`] })).toBe(false)
  expect(validation.Check({ Состав: [UUID] })).toBe(false)
})

it("does not transport an untagged value and rejects malformed tagged payload before export", () => {
  const convert = (source: string) => convertPropertiesFromYAMLToXML({
    context: mockContextToXML(),
    yaml: importFromYAML(source),
    rule,
    outputs: [{ key: "owner" }],
    execution,
  })

  expect(() => convert(`Состав: [${UUID}]`)).toThrow("Неизвестный корень")
  expect(() => convert(`Состав: [!xml ${UUID}x]`)).toThrow(
    "Битая MDObjectRef-ссылка должна содержать канонический UUID",
  )
})
