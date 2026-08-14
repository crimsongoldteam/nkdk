import { Type } from "typebox"
import { describe, expect, it } from "vitest"

import {
  importFromYAML,
  xmlScalarTagPayload,
  yamlScalarTagAt,
} from "@nkdk/runtime"
import {
  brokenXMLReferenceCarrier,
  createPropertyRuleExecutor,
  createPropertyRuleRegistrySet,
  defineMetadataRules,
  emptyMetadataRules,
  withPropertyRuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import { mockContext, mockContextFromXML } from "../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { importPropertiesFromXMLToYAML } from "./fromXMLToYAML"
import { convertPropertiesFromYAMLToXML } from "./fromYAMLToXML"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import type { MetadataItemRule } from "./types"

const probeCarrier = brokenXMLReferenceCarrier("probe", "ReferenceProbe", {
  tryImport: ({ xmlValue, yamlValue }) => {
    if (xmlValue === "broken") {
      return { yamlValue: "!xml broken", taggedPaths: [[]] }
    }
    if (Array.isArray(xmlValue) && Array.isArray(yamlValue)) {
      return {
        yamlValue: yamlValue.map((value, index) => index === 1 ? `!xml ${value}` : value),
        taggedPaths: [[1]],
      }
    }
    return undefined
  },
  prepareExport: ({ isTagged }) => isTagged([])
    ? { yamlValue: "ordinary", transportedPaths: [[]] }
    : undefined,
  patchExportedXML: ({ yamlValue }) => xmlScalarTagPayload(String(yamlValue)),
  validationSchema: ({ base, validationGraph }) => validationGraph
    ? Type.Union([base, Type.String({ pattern: "^!xml broken$" })])
    : base,
})

const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(
  defineMetadataRules({
    ...emptyMetadataRules,
    propertyTypes: {
      ReferenceProbe: {
        importFromXML: (_context, _rule, value) => value,
        exportToYAML: (_context, _rule, value) => value,
        importFromYAML: (_context, _rule, value) => value,
        exportToXML: (_context, _rule, value) => `converted:${value}`,
        exportToJSONSchema: () => Type.String({ pattern: "^ordinary$" }),
      },
    },
    brokenXMLReferenceCarriers: [probeCarrier],
  }),
))

const contextualCarrier = brokenXMLReferenceCarrier("contextual-probe", "number", {
  tryImport: ({ xmlValue }) => xmlValue === 7
    ? { yamlValue: "!xml 7", taggedPaths: [[]] }
    : undefined,
  prepareExport: ({ isTagged }) => isTagged([])
    ? { yamlValue: 7, transportedPaths: [[]] }
    : undefined,
  patchExportedXML: () => 7,
  validationSchema: ({ base, validationGraph }) => validationGraph
    ? Type.Union([base, Type.Literal("!xml 7")])
    : base,
})

const contextualRegistry = createPropertyRuleRegistrySet(defineMetadataRules({
  ...emptyMetadataRules,
  brokenXMLReferenceCarriers: [contextualCarrier],
}))

describe("broken XML reference property pipeline", () => {
  it("использует контекстный carrier без явного execution", () => {
    const rule = {
      itemType: "ContextualBrokenReferenceProbe",
      properties: {
        reference: { type: "number", xml: "Reference", yaml: "Ссылка" },
      },
    } as MetadataItemRule
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }

    const yaml = withPropertyRuleRegistrySet(contextualRegistry, () =>
      importPropertiesFromXMLToYAML({
        context,
        rule,
        sources: [{ context, xml: { Reference: 7 } }],
        yamlPath: [],
        rulePath: [],
        collector: createLocalIndexesCollector(),
      }))
    expect(yaml).toEqual({ Ссылка: "!xml 7" })
    expect(yamlScalarTagAt(yaml, "Ссылка")).toBe("xml")

    const exported = withPropertyRuleRegistrySet(contextualRegistry, () =>
      convertPropertiesFromYAMLToXML({
        context: { defaultLanguage: "ru", version: "test", exportToXML: { version: "test", itemsTree: [] } },
        yaml: importFromYAML("Ссылка: !xml 7"),
        rule,
        outputs: [{ key: "owner" }],
      }).outputs.get("owner"))
    expect(exported).toEqual({ Reference: 7 })

    const properties = withPropertyRuleRegistrySet(contextualRegistry, () =>
      exportPropertiesToJSONSchema({
        context: {
          ...mockContext,
          exportToJSONSchema: { mode: "inline", refs: new Set<string>(), validationPropertyRefs: true },
        },
        rule,
      }))
    const validation = compileValidationSchema({}, Type.Object(properties))
    expect(validation.Check({ Ссылка: "!xml 7" })).toBe(true)
  })

  it("marks only XML values accepted by the carrier", () => {
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule: {
        itemType: "BrokenReferenceProbe",
        properties: {
          reference: { type: "ReferenceProbe", xml: "Reference", yaml: "Ссылка" },
          references: { type: "ReferenceProbe", xml: "References", yaml: "Ссылки" },
          ordinary: { type: "ReferenceProbe", xml: "Ordinary", yaml: "Обычная" },
        },
      } as MetadataItemRule,
      sources: [{
        context,
        xml: {
          Reference: "broken",
          References: ["ordinary", "broken"],
          Ordinary: "ordinary",
        },
      }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      execution,
    })

    expect(yaml).toEqual({
      Ссылка: "!xml broken",
      Ссылки: ["ordinary", "!xml broken"],
      Обычная: "ordinary",
    })
    expect(yamlScalarTagAt(yaml, "Ссылка")).toBe("xml")
    expect(yamlScalarTagAt((yaml as { Ссылки: unknown[] }).Ссылки, 0)).toBeUndefined()
    expect(yamlScalarTagAt((yaml as { Ссылки: unknown[] }).Ссылки, 1)).toBe("xml")
    expect(yamlScalarTagAt(yaml, "Обычная")).toBeUndefined()
  })

  it("restores tagged YAML after ordinary conversion", () => {
    const rule = {
      itemType: "BrokenReferenceProbe",
      properties: {
        reference: { type: "ReferenceProbe", yaml: "Ссылка", xml: "Reference" },
      },
    } as MetadataItemRule
    const convert = (source: string) => convertPropertiesFromYAMLToXML({
      context: {
        defaultLanguage: "ru",
        version: "test",
        exportToXML: { version: "test", itemsTree: [] },
      },
      yaml: importFromYAML(source),
      rule,
      outputs: [{ key: "owner" }],
      execution,
    }).outputs.get("owner")

    expect(convert("Ссылка: !xml broken")).toEqual({ Reference: "broken" })
    expect(convert('Ссылка: "!xml broken"')).toEqual({
      Reference: "converted:!xml broken",
    })
  })

  it("adds its grammar only to the validation graph", () => {
    const rule = {
      itemType: "BrokenReferenceProbe",
      properties: {
        reference: { type: "ReferenceProbe", yaml: "Ссылка", xml: "Reference" },
      },
    } as MetadataItemRule
    const properties = (validationPropertyRefs: boolean) =>
      exportPropertiesToJSONSchema({
        context: {
          ...mockContext,
          exportToJSONSchema: {
            mode: "inline",
            refs: new Set<string>(),
            ...(validationPropertyRefs ? { validationPropertyRefs: true as const } : {}),
          },
        },
        rule,
        execution,
      })
    const validationProperties = properties(true)
    const externalProperties = properties(false)
    const validation = compileValidationSchema({}, Type.Object(validationProperties))
    const external = compileValidationSchema({}, Type.Object(externalProperties))

    expect(validation.Check({ Ссылка: "!xml broken" })).toBe(true)
    expect(validation.Check({ Ссылка: "!xml other" })).toBe(false)
    expect(external.Check({ Ссылка: "!xml broken" })).toBe(false)
    expect(JSON.stringify(externalProperties)).not.toContain("!xml")
  })
})
