import { Type } from "typebox"
import { describe, expect, it } from "vitest"

import {
  importFromYAML,
  xmlAnomalyTagPayload,
  yamlMappingKeyTagAt,
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
import { mockContext, mockContextFromXML, mockLanguages } from "../../../tests/mockContext"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { importPropertiesFromXMLToYAML } from "./fromXMLToYAML"
import { convertPropertiesFromYAMLToXML } from "./fromYAMLToXML"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import type { MetadataItemRule } from "./types"

const KEY_UUID = "6537a19c-3357-46a2-96a6-1fe4619ddbc8"
const keyLocation = { kind: "key", path: ["Роли"], key: KEY_UUID } as const
const { propertyType: _keyPropertyType, ...keyProbeCarrier } = brokenXMLReferenceCarrier(
  "key-probe",
  "KeyReferenceProbe",
  {
    tryImport: ({ xmlValue, yamlValue }) => xmlValue === "broken-key"
      ? { yamlValue, taggedLocations: [keyLocation] }
      : undefined,
    prepareExport: ({ yamlValue, isTagged }) => isTagged(keyLocation)
      ? { yamlValue, transportedLocations: [keyLocation] }
      : undefined,
    patchExportedXML: ({ yamlValue }) => yamlValue,
    matchesTaggedYAML: ({ yamlValue, location, isTagged }) =>
      location.kind === "key"
      && location.key === KEY_UUID
      && typeof yamlValue === "object"
      && yamlValue !== null
      && isTagged(location),
  },
)

const probeCarrier = brokenXMLReferenceCarrier("probe", "ReferenceProbe", {
  tryImport: ({ xmlValue, yamlValue }) => {
    if (xmlValue === "broken") {
      return { yamlValue: "!xml/reference broken", taggedLocations: [{ kind: "value", path: [] }] }
    }
    if (Array.isArray(xmlValue) && Array.isArray(yamlValue)) {
      return {
        yamlValue: yamlValue.map((value, index) => index === 1 ? `!xml/reference ${value}` : value),
        taggedLocations: [{ kind: "value", path: [1] }],
      }
    }
    return undefined
  },
  prepareExport: ({ isTagged }) => isTagged({ kind: "value", path: [] })
    ? { yamlValue: "ordinary", transportedLocations: [{ kind: "value", path: [] }] }
    : undefined,
  patchExportedXML: ({ yamlValue }) => xmlAnomalyTagPayload("xml/reference", String(yamlValue)),
  validationSchema: ({ base, validationGraph }) => validationGraph
    ? Type.Union([base, Type.String({ pattern: "^!xml/reference broken$" })])
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
      KeyReferenceProbe: {
        importFromXML: (_context, _rule, value) => value,
        exportToYAML: (_context, _rule, value) => value === "broken-key"
          ? { Роли: { [KEY_UUID]: "Истина", Кассир: "Ложь" } }
          : value,
        importFromYAML: (_context, _rule, value) => value,
        exportToXML: (_context, _rule, value) => value,
        exportToJSONSchema: () => Type.Any(),
        brokenXMLReferenceCarrier: keyProbeCarrier,
      },
    },
    brokenXMLReferenceCarriers: [probeCarrier],
  }),
))

const contextualCarrier = brokenXMLReferenceCarrier("contextual-probe", "number", {
  tryImport: ({ xmlValue }) => xmlValue === 7
    ? { yamlValue: "!xml/reference 7", taggedLocations: [{ kind: "value", path: [] }] }
    : undefined,
  prepareExport: ({ isTagged }) => isTagged({ kind: "value", path: [] })
    ? { yamlValue: 7, transportedLocations: [{ kind: "value", path: [] }] }
    : undefined,
  patchExportedXML: () => 7,
  validationSchema: ({ base, validationGraph }) => validationGraph
    ? Type.Union([base, Type.Literal("!xml/reference 7")])
    : base,
})

const contextualRegistry = createPropertyRuleRegistrySet(defineMetadataRules({
  ...emptyMetadataRules,
  brokenXMLReferenceCarriers: [contextualCarrier],
}))

function convertYAMLToXML(
  source: string,
  rule: MetadataItemRule,
  execution: Parameters<typeof convertPropertiesFromYAMLToXML>[0]["execution"],
) {
  return convertPropertiesFromYAMLToXML({
    context: {
      languages: mockLanguages,
      version: "test",
      exportToXML: { version: "test", itemsTree: [] },
    },
    yaml: importFromYAML(source),
    rule,
    outputs: [{ key: "owner" }],
    execution,
  }).outputs.get("owner")
}

describe("broken XML reference property pipeline", () => {
  it("переносит !xml/reference на ключе через type rule", () => {
    const context = { ...mockContextFromXML(), exportToYAML: { toTyped: true } }
    const rule = {
      itemType: "BrokenKeyReferenceProbe",
      properties: {
        reference: { type: "KeyReferenceProbe", xml: "Reference", yaml: "Ссылка" },
      },
    } as MetadataItemRule
    const yaml = importPropertiesFromXMLToYAML({
      context,
      rule,
      sources: [{ context, xml: { Reference: "broken-key" } }],
      yamlPath: [],
      rulePath: [],
      collector: createLocalIndexesCollector(),
      execution,
    }) as { Ссылка: { Роли: Record<string, string> } }

    expect(yaml.Ссылка.Роли).toEqual({ [KEY_UUID]: "Истина", Кассир: "Ложь" })
    expect(yamlMappingKeyTagAt(yaml.Ссылка.Роли, KEY_UUID)).toBe("xml/reference")
    expect(yamlMappingKeyTagAt(yaml.Ссылка.Роли, "Кассир")).toBeUndefined()

    expect(convertYAMLToXML([
      "Ссылка:",
      "  Роли:",
      `    !xml/reference ${KEY_UUID}: Истина`,
      "    Кассир: Ложь",
    ].join("\n"), rule, execution)).toEqual({
      Reference: { Роли: { [KEY_UUID]: "Истина", Кассир: "Ложь" } },
    })
  })

  it("отклоняет пустой тегированный ключ вне поддерживающего его типа", () => {
    const rule = {
      itemType: "UnsupportedEmptyBrokenKeyProbe",
      properties: {
        reference: { type: "KeyReferenceProbe", xml: "Reference", yaml: "Ссылка" },
      },
    } as MetadataItemRule

    expect(() => convertYAMLToXML([
      "Ссылка:",
      "  Роли:",
      '    !xml/reference "": Истина',
    ].join("\n"), rule, execution)).toThrow(
      "Тег !xml/reference у ключа не поддерживается типом свойства",
    )
  })

  it("выбирает переносчик только после принятия tagged payload", () => {
    const carrier = (name: string, accepted: readonly string[]) => brokenXMLReferenceCarrier(name, "CoexistingProbe", {
      prepareExport: ({ yamlValue, isTagged }) =>
        isTagged({ kind: "value", path: [] }) && typeof yamlValue === "string" && accepted.includes(yamlValue)
          ? {
              yamlValue: xmlAnomalyTagPayload("xml/reference", yamlValue),
              transportedLocations: [{ kind: "value", path: [] }],
            }
          : undefined,
      patchExportedXML: ({ yamlValue }) => xmlAnomalyTagPayload("xml/reference", String(yamlValue)),
    })
    const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        CoexistingProbe: {
          importFromYAML: (_context, _rule, value) => value,
          exportToXML: (_context, _rule, value) => `converted:${value}`,
        },
      },
      brokenXMLReferenceCarriers: [
        carrier("first", ["!xml/reference first", "!xml/reference shared"]),
        carrier("second", ["!xml/reference second", "!xml/reference shared"]),
      ],
    })))
    const rule = {
      itemType: "CoexistingCarrierProbe",
      properties: {
        reference: { type: "CoexistingProbe", yaml: "Ссылка", xml: "Reference" },
      },
    } as MetadataItemRule
    const convert = (source: string) => convertYAMLToXML(source, rule, execution)

    expect(convert("Ссылка: !xml/reference second")).toEqual({ Reference: "second" })
    expect(convert("Ссылка: !xml/value second")).toEqual({ Reference: "converted:!xml/value second" })
    expect(convert("Ссылка: !xml/reference ordinary")).toEqual({ Reference: "converted:!xml/reference ordinary" })
    expect(() => convert("Ссылка: !xml/reference shared"))
      .toThrow("Конфликт переносчиков битой XML-ссылки: first, second")
  })

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
    expect(yaml).toEqual({ Ссылка: "!xml/reference 7" })
    expect(yamlScalarTagAt(yaml, "Ссылка")).toBe("xml/reference")

    const exported = withPropertyRuleRegistrySet(contextualRegistry, () =>
      convertPropertiesFromYAMLToXML({
        context: { languages: mockLanguages, version: "test", exportToXML: { version: "test", itemsTree: [] } },
        yaml: importFromYAML("Ссылка: !xml/reference 7"),
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
    expect(validation.Check({ Ссылка: "!xml/reference 7" })).toBe(true)
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
      Ссылка: "!xml/reference broken",
      Ссылки: ["ordinary", "!xml/reference broken"],
      Обычная: "ordinary",
    })
    expect(yamlScalarTagAt(yaml, "Ссылка")).toBe("xml/reference")
    expect(yamlScalarTagAt((yaml as { Ссылки: unknown[] }).Ссылки, 0)).toBeUndefined()
    expect(yamlScalarTagAt((yaml as { Ссылки: unknown[] }).Ссылки, 1)).toBe("xml/reference")
    expect(yamlScalarTagAt(yaml, "Обычная")).toBeUndefined()
  })

  it("restores tagged YAML after ordinary conversion", () => {
    const rule = {
      itemType: "BrokenReferenceProbe",
      properties: {
        reference: { type: "ReferenceProbe", yaml: "Ссылка", xml: "Reference" },
      },
    } as MetadataItemRule
    const convert = (source: string) => convertYAMLToXML(source, rule, execution)

    expect(convert("Ссылка: !xml/reference broken")).toEqual({ Reference: "broken" })
    expect(convert('Ссылка: "!xml/reference broken"')).toEqual({
      Reference: "converted:!xml/reference broken",
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

    expect(validation.Check({ Ссылка: "!xml/reference broken" })).toBe(true)
    expect(validation.Check({ Ссылка: "!xml/reference other" })).toBe(false)
    expect(validation.Check({ Ссылка: "!xml/value broken" })).toBe(false)
    expect(external.Check({ Ссылка: "!xml/reference broken" })).toBe(false)
    expect(JSON.stringify(externalProperties)).not.toContain("!xml")
  })
})
