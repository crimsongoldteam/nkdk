import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { encodeConfigurationIndex } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { childSegmentUid } from "@nkdk/runtime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "@nkdk/runtime"
import type { ConfigurationSnapshot } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { configurationExtensionYamlToXmlAugmenter } from "./exportPropertyStates"
import { MetadataConfigurationExtensionRules } from "./rules"

const BASE_UUID = "11111111-1111-4111-8111-111111111111"
const logicalAddress = "Catalog.Товары.Attribute.Дата"
const rule = {
  itemType: "ClientApplicationForm",
  xmlOrder: ["format", "form"],
  properties: {
    format: {
      type: "string",
      yaml: "Формат",
      xml: "Format",
      xmlParents: ["Form", "Properties"],
    },
    form: { type: "string", yaml: "Форма", xml: "Form" },
  },
} as const satisfies MetadataItemRule

describe("configuration extension YAML-to-XML augmenter", () => {
  it("writes service properties in current rules order and states from control", () => {
    const outputs = new Map<string, Record<string, unknown>>([
      ["metadata", { Form: { Properties: { Format: "date" } } }],
      ["body", {}],
    ])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { [logicalAddress]: BASE_UUID },
        extended: ["form"],
      }),
      rule,
      yaml: {
        Контроль: ["Формат", "ОбъектРасширяемойКонфигурации"],
      },
      outputs,
      logicalAddress,
    })

    const form = record(outputs.get("metadata")?.Form)
    expect(form.Properties).toMatchObject({
      ObjectBelonging: "Adopted",
      ExtendedConfigurationObject: BASE_UUID,
    })
    expect(Object.keys(record(form.Properties))).toEqual(["ObjectBelonging", "Format", "ExtendedConfigurationObject"])
    expect(record(form.InternalInfo)["xr:PropertyState"]).toEqual([
      { "xr:Property": "ExtendedConfigurationObject", "xr:State": "Notify" },
      { "xr:Property": "Format", "xr:State": "Notify" },
      { "xr:Property": "Form", "xr:State": "Extended" },
    ])
    expect(outputs.get("body")).toEqual({})
  })

  it("orders the adopted catalog service property by its real rules", () => {
    const outputs = new Map([
      [
        "metadata",
        {
          Properties: {
            Name: "Товары",
            Synonym: "Товары",
          },
        },
      ],
    ])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { "Catalog.Товары": BASE_UUID },
      }),
      rule: MetadataCatalogRules,
      yaml: {},
      outputs,
      logicalAddress: "Catalog.Товары",
    })

    expect(Object.keys(record(record(outputs.get("metadata")).Properties))).toEqual([
      "ObjectBelonging",
      "Name",
      "ExtendedConfigurationObject",
      "Synonym",
    ])
  })

  it("copies only xml.extended into the next snapshot", () => {
    const testContext = context({
      adoptedUuids: { [logicalAddress]: BASE_UUID },
      extended: ["form"],
    })
    configurationExtensionYamlToXmlAugmenter.augment({
      context: testContext,
      rule,
      yaml: {},
      outputs: new Map([["metadata", { Form: { Properties: { Format: "date" } } }]]),
      logicalAddress,
    })

    expect(testContext.exportToXML.configurationIndex!.collector.fragment("Форма.yaml").entities).toEqual([
      {
        logicalAddress: childSegmentUid(logicalAddress, "form"),
        sourceProjectPath: "Форма.yaml",
        xml: { extended: true },
      },
    ])
  })

  it("does not mark an own address as adopted", () => {
    const outputs = new Map([["metadata", { Form: { Properties: {} } }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {} }),
      rule,
      yaml: {},
      outputs,
      logicalAddress,
    })

    expect(record(record(outputs.get("metadata")).Form).Properties).toEqual({})
  })

  it("does not leak root adoption into a nested external item", () => {
    const outputs = new Map([["metadata", { Properties: {} }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { [logicalAddress]: BASE_UUID },
      }),
      rule: {
        itemType: "HomePageWorkArea",
        properties: {},
      } as MetadataItemRule,
      yaml: {},
      outputs,
      logicalAddress,
    })

    expect(record(outputs.get("metadata")).Properties).toEqual({})
  })

  it("marks the extension root as adopted without a base UUID", () => {
    const outputs = new Map([["metadata", { Properties: {} }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {} }),
      rule: MetadataConfigurationExtensionRules,
      yaml: {},
      outputs,
      logicalAddress: "Конфигурация",
    })

    expect(record(outputs.get("metadata")).Properties).toEqual({
      ObjectBelonging: "Adopted",
    })
  })

  it("writes the base UUID for an extended configuration root", () => {
    const outputs = new Map([["metadata", { Properties: {} }]])
    const testContext = context({
      adoptedUuids: { Конфигурация: BASE_UUID },
    })
    configurationExtensionYamlToXmlAugmenter.augment({
      context: testContext,
      rule: MetadataConfigurationExtensionRules,
      yaml: {},
      outputs,
      logicalAddress: "Конфигурация",
    })

    expect(record(outputs.get("metadata")).Properties).toEqual({
      ObjectBelonging: "Adopted",
      ExtendedConfigurationObject: BASE_UUID,
    })
    expect(testContext.exportToXML.configurationIndex!.collector.fragment("Конфигурация.yaml").entities).toEqual([
      {
        logicalAddress: "Конфигурация",
        sourceProjectPath: "Конфигурация.yaml",
        xml: { extended: true },
      },
    ])
  })

  it("does not restore empty InternalInfo absent from current rules and YAML", () => {
    const outputs = new Map([["metadata", { Properties: { Name: "Русский" } }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { [logicalAddress]: BASE_UUID },
      }),
      rule: {
        itemType: "MetadataLanguage",
        properties: {
          name: {
            type: "string",
            xml: "Name",
            xmlParents: ["Properties"],
          },
        },
      },
      yaml: {},
      outputs,
      logicalAddress,
    })

    expect(record(outputs.get("metadata"))).not.toHaveProperty("InternalInfo")
  })

  it("rejects an unknown control name with the logical address", () => {
    expect(() =>
      configurationExtensionYamlToXmlAugmenter.augment({
        context: context({ adoptedUuids: {} }),
        rule,
        yaml: { Контроль: ["Неизвестное"] },
        outputs: new Map([["metadata", { Form: { Properties: {} } }]]),
        logicalAddress,
      })
    ).toThrow(`Неизвестное свойство Контроль "Неизвестное": ${logicalAddress}`)
  })

  it("prefers Notify when the same property is saved as Extended", () => {
    const outputs = new Map([["metadata", { Form: { Properties: {} } }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {}, extended: ["form"] }),
      rule,
      yaml: { Контроль: ["Форма"] },
      outputs,
      logicalAddress,
    })

    expect(record(record(record(outputs.get("metadata")).Form).InternalInfo)["xr:PropertyState"]).toEqual([
      { "xr:Property": "Form", "xr:State": "Notify" },
    ])
  })

  it("restores Extended for a property that is stored outside YAML", () => {
    const outputs = new Map([["metadata", { InternalInfo: {}, Properties: {} }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {}, extended: ["module"] }),
      rule: {
        itemType: "MetadataCommonModule",
        properties: {
          module: {
            type: "Module",
            xmlPath: "Ext/Module.bsl",
          },
        },
      },
      yaml: {},
      outputs,
      logicalAddress,
    })

    expect(record(record(outputs.get("metadata")).InternalInfo)["xr:PropertyState"]).toEqual([
      { "xr:Property": "Module", "xr:State": "Extended" },
    ])
  })
})

function context(params: {
  adoptedUuids: Readonly<Record<string, string>>
  extended?: readonly string[]
}): ConfigurationContextWithExportToXML {
  const snapshot: ConfigurationSnapshot = {
    specificationVersion: "1.3",
    indexGeneration: 1n,
    componentPath: "cfe/Дополнение",
    files: [{ projectPath: "Форма.yaml", contentHash: 1n }],
    entities: (params.extended ?? []).map((segment) => ({
      logicalAddress: childSegmentUid(logicalAddress, segment),
      sourceProjectPath: "Форма.yaml",
      xml: { extended: true },
    })),
  }
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToXML: {
      version: "2.20",
      itemsTree: [],
      adoptedUuids: params.adoptedUuids,
      componentKind: "configurationExtension",
      configurationIndex: createConfigurationIndexExportRuntime({
        source: createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(snapshot))),
        collector: createConfigurationIndexCollector(),
        targetProjectPath: "Форма.yaml",
        logicalAddress,
      }),
    },
  }
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}
