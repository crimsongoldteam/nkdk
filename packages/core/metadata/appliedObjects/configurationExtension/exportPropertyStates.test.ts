import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { childSegmentUid } from "../../configurationIndex/logicalAddress"
import { snapshotConfigurationIndex, createConfigurationIndexReader } from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { configurationExtensionYamlToXmlAugmenter } from "./exportPropertyStates"
import { MetadataConfigurationExtensionRules } from "./rules"

const BASE_UUID = "11111111-1111-1111-1111-111111111111"
const logicalAddress = "Catalog.Товары.Attribute.Дата"
const rule = {
  itemType: "ClientApplicationForm",
  properties: {
    format: { type: "string", yaml: "Формат", xml: "Format" },
    form: { type: "string", yaml: "Форма", xml: "Form" },
  },
} as const satisfies MetadataItemRule

describe("configuration extension YAML-to-XML augmenter", () => {
  it("writes adoption and ordered Notify/Extended states", () => {
    const outputs = new Map<string, Record<string, unknown>>([
      ["metadata", { Form: { Properties: { Format: "date" } } }],
      ["body", {}],
    ])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { [logicalAddress]: BASE_UUID },
        extended: ["form"],
        serviceItemType: "ClientApplicationForm",
        order: [
          "objectBelonging",
          "format",
          "extendedConfigurationObject",
        ],
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
    expect(Object.keys(record(form.Properties))).toEqual([
      "ObjectBelonging",
      "Format",
      "ExtendedConfigurationObject",
    ])
    expect(record(form.InternalInfo)["xr:PropertyState"]).toEqual([
      { "xr:Property": "ExtendedConfigurationObject", "xr:State": "Notify" },
      { "xr:Property": "Format", "xr:State": "Notify" },
      { "xr:Property": "Form", "xr:State": "Extended" },
    ])
    expect(outputs.get("body")).toEqual({})
  })

  it("copies extension-only snapshot state into the next snapshot", () => {
    const testContext = context({
      adoptedUuids: { [logicalAddress]: BASE_UUID },
      extended: ["form"],
      internalInfoItemType: "ClientApplicationForm",
      serviceItemType: "ClientApplicationForm",
      order: [
        "internalInfo",
        "objectBelonging",
        "format",
        "extendedConfigurationObject",
      ],
    })
    configurationExtensionYamlToXmlAugmenter.augment({
      context: testContext,
      rule,
      yaml: {},
      outputs: new Map([["metadata", { Form: { Properties: { Format: "date" } } }]]),
      logicalAddress,
    })

    const fragment = testContext.exportToXML.configurationIndex!.collector
      .fragment("Форма.yaml")
    expect(fragment.xmlNodes).toEqual(expect.arrayContaining([
      {
        logicalAddress: childSegmentUid(
          logicalAddress,
          "extensionPropertyOrder:ClientApplicationForm"
        ),
        order: [
          "internalInfo",
          "objectBelonging",
          "format",
          "extendedConfigurationObject",
        ],
        present: ["objectBelonging", "extendedConfigurationObject"],
      },
      {
        logicalAddress: childSegmentUid(
          logicalAddress,
          "extensionInternalInfo:ClientApplicationForm"
        ),
        present: ["internalInfo"],
      },
    ]))
    expect(fragment.xmlValues).toContainEqual({
      logicalAddress: childSegmentUid(logicalAddress, "form"),
      extended: true,
    })
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
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { Конфигурация: BASE_UUID },
      }),
      rule: MetadataConfigurationExtensionRules,
      yaml: {},
      outputs,
      logicalAddress: "Конфигурация",
    })

    expect(record(outputs.get("metadata")).Properties).toEqual({
      ObjectBelonging: "Adopted",
      ExtendedConfigurationObject: BASE_UUID,
    })
  })

  it("restores an indexed empty InternalInfo omitted from the item rule", () => {
    const outputs = new Map([
      ["metadata", { Properties: { Name: "Русский" } }],
    ])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { [logicalAddress]: BASE_UUID },
        internalInfoItemType: "MetadataLanguage",
        orderItemType: "MetadataLanguage",
        order: [
          "internalInfo",
          "objectBelonging",
          "name",
          "extendedConfigurationObject",
        ],
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

    expect(Object.keys(record(outputs.get("metadata")))).toEqual([
      "InternalInfo",
      "Properties",
    ])
    expect(record(outputs.get("metadata")).InternalInfo).toEqual({})
  })

  it("does not reuse another item type's indexed InternalInfo", () => {
    const outputs = new Map([
      ["metadata", { AdditionalIndex: [] }],
    ])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: {},
        internalInfoItemType: "MetadataLanguage",
      }),
      rule: {
        itemType: "AdditionalIndexes",
        properties: {},
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

    expect(
      record(record(record(outputs.get("metadata")).Form).InternalInfo)["xr:PropertyState"]
    ).toEqual([
      { "xr:Property": "Form", "xr:State": "Notify" },
    ])
  })

  it("restores Extended for a property that is stored outside YAML", () => {
    const outputs = new Map([
      ["metadata", { InternalInfo: {}, Properties: {} }],
    ])
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

    expect(record(record(outputs.get("metadata")).InternalInfo)["xr:PropertyState"])
      .toEqual([
        { "xr:Property": "Module", "xr:State": "Extended" },
      ])
  })
})

function context(params: {
  adoptedUuids: Readonly<Record<string, string>>
  extended?: readonly string[]
  internalInfoItemType?: string
  order?: readonly string[]
  orderItemType?: string
  serviceItemType?: string
}): ConfigurationContextWithExportToXML {
  const data = sampleIndex()
  const snapshot = snapshotConfigurationIndex(encodeConfigurationIndex({
    ...data,
    xmlNodes: [
      ...(
        params.order === undefined
          ? data.xmlNodes
          : [
              ...data.xmlNodes.filter(
                (node) => node.logicalAddress !== childSegmentUid(
                  logicalAddress,
                  `extensionPropertyOrder:${params.orderItemType ?? "ClientApplicationForm"}`
                )
              ),
              {
                logicalAddress: childSegmentUid(
                  logicalAddress,
                  `extensionPropertyOrder:${params.orderItemType ?? "ClientApplicationForm"}`
                ),
                order: [...params.order],
                ...(
                  params.serviceItemType === undefined
                    ? {}
                    : { present: ["objectBelonging", "extendedConfigurationObject"] }
                ),
              },
            ]
      ),
      ...(
        params.order !== undefined || params.serviceItemType === undefined
          ? []
          : [{
              logicalAddress: childSegmentUid(
                logicalAddress,
                `extensionPropertyOrder:${params.serviceItemType}`
              ),
              present: ["objectBelonging", "extendedConfigurationObject"],
            }]
      ),
      ...(
        params.internalInfoItemType === undefined
          ? []
          : [{
              logicalAddress: childSegmentUid(
                logicalAddress,
                `extensionInternalInfo:${params.internalInfoItemType}`
              ),
              present: ["internalInfo"],
            }]
      ),
    ],
    xmlValues: (params.extended ?? []).map((segment) => ({
      logicalAddress: childSegmentUid(logicalAddress, segment),
      extended: true as const,
    })),
  }))
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToXML: {
      version: "2.20",
      itemsTree: [],

      adoptedUuids: params.adoptedUuids,
      componentKind: "configurationExtension",
      configurationIndex: createConfigurationIndexExportRuntime({
        source: createConfigurationIndexReader(snapshot),
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
