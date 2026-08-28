import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { markYAMLScalarTag } from "@nkdk/runtime"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { MetadataCommonFormRules } from "../metadataCommonForm/rules"
import { configurationExtensionYamlToXmlAugmenter } from "./exportPropertyStates"
import { withOperationRegistrySet } from "../../operations/operationExecutionContext"
import { createPropertyStateCapabilityRegistry, definePropertyStateItemCapabilities, externalProperty } from "./propertyStateCapabilities"
import { MetadataConfigurationExtensionRules } from "./rules"
import { MetadataExternalDataSourceTableRules } from "../../commonObjects/metadataExternalDataSourceTable/rules"
import { metadataExternalDataSourceTablePropertyStateCapabilities } from "../../commonObjects/metadataExternalDataSourceTable/propertyStates"
import { configurationExtensionPropertyStateProfiles } from "./propertyStateProfiles"
import { configurationExtensionPropertyStateCapabilities } from "./propertyStateRules"
import { mockLanguages } from "../../../tests/mockContext"
import { writeExtendedConfigurationObjectYAML } from "./extendedConfigurationObjectYAML"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"
import { clearedReferencePropertyStateCapabilities, clearedReferenceRule } from "./clearedReference.testFixture"

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
    extendedConfigurationObject: { type: "string", runtimeOnly: true },
    objectBelonging: { type: "string", runtimeOnly: true },
  },
} as const satisfies MetadataItemRule

function exportEmptyProperty(
  emptyRule: MetadataItemRule,
  propertyKey: string,
  modes: readonly ("control" | "notify" | "extend")[],
  yaml: Record<string, unknown>,
): Record<string, unknown> {
  const outputs = new Map<string, Record<string, unknown>>([["metadata", { Properties: {} }]])
  const contribution = definePropertyStateItemCapabilities(emptyRule, {
    properties: {
      [propertyKey]: { availability: "borrowed", modes, representation: "tagged" },
    },
  })

  withOperationRegistrySet({
    propertyStates: createPropertyStateCapabilityRegistry([contribution]),
  }, () => configurationExtensionYamlToXmlAugmenter.augment({
    context: context({ adoptedUuids: {} }),
    rule: emptyRule,
    yaml,
    outputs,
    logicalAddress,
  }))

  return record(outputs.get("metadata")).Properties as Record<string, unknown>
}

describe("configuration extension YAML-to-XML augmenter", () => {
  it("writes an empty plain I8n property as an empty XML element", () => {
    const emptyI8nRule = {
      itemType: "EmptyI8nProbe",
      properties: {
        toolTip: { type: "I8nText", yaml: "Подсказка", xml: "ToolTip", xmlParents: ["Properties"] },
      },
    } as const satisfies MetadataItemRule
    const outputs = new Map<string, Record<string, unknown>>([["metadata", {
      Properties: { ToolTip: { "v8:item": { "v8:lang": "ru", "v8:content": "" } } },
    }]])
    const contribution = definePropertyStateItemCapabilities(emptyI8nRule, {
      properties: {
        toolTip: { availability: "borrowed", modes: ["extend"], representation: "plain" },
      },
    })

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([contribution]),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {} }),
      rule: emptyI8nRule,
      yaml: { Подсказка: "" },
      outputs,
      logicalAddress,
    }))

    expect(record(outputs.get("metadata")).Properties).toEqual({ ToolTip: "" })
  })

  it("writes an explicitly empty tagged property as an empty XML element", () => {
    const emptyRule = {
      itemType: "EmptyTaggedProbe",
      properties: {
        format: { type: "string", yaml: "Формат", xml: "Format", xmlParents: ["Properties"] },
      },
    } as const satisfies MetadataItemRule
    expect(exportEmptyProperty(emptyRule, "format", ["control", "notify", "extend"], { Формат: "" }))
      .toEqual({ Format: "" })
  })

  it("writes a registered empty type as an empty XML element", () => {
    const emptyRule = {
      itemType: "EmptyTypeProbe",
      properties: {
        type: { type: "TypeDescription", yaml: "Тип", xml: "Type", xmlParents: ["Properties"] },
      },
    } as const satisfies MetadataItemRule
    expect(exportEmptyProperty(emptyRule, "type", ["control", "notify"], { Тип: [] }))
      .toEqual({ Type: "" })
  })

  it("writes service properties in current rules order and states from control", () => {
    const outputs = new Map<string, Record<string, unknown>>([
      ["metadata", { Form: { Properties: { Format: "date" } } }],
      ["body", {}],
    ])
    const yaml = { Формат: "date", ОбъектРасширяемойКонфигурации: {} }
    markYAMLScalarTag(yaml, "Формат", "проверять")
    markYAMLScalarTag(yaml, "ОбъектРасширяемойКонфигурации", "проверять")
    const contribution = definePropertyStateItemCapabilities(rule, {
      properties: {
        extendedConfigurationObject: { availability: "borrowed", modes: ["control", "notify"], representation: "tagged" },
        format: { availability: "borrowed", modes: ["control", "notify"], representation: "tagged" },
      },
    })
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([contribution]),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { [logicalAddress]: BASE_UUID },
        extendedLogicalAddresses: [logicalAddress],
      }),
      rule,
      yaml,
      outputs,
      logicalAddress,
    }))

    const form = record(outputs.get("metadata")?.Form)
    expect(form.Properties).toMatchObject({
      ObjectBelonging: "Adopted",
      ExtendedConfigurationObject: BASE_UUID,
    })
    expect(Object.keys(record(form.Properties))).toEqual(["ObjectBelonging", "Format", "ExtendedConfigurationObject"])
    expect(Object.keys(form)).toEqual(["InternalInfo", "Properties"])
    expect(record(form.InternalInfo)["xr:PropertyState"]).toEqual([
      { "xr:Property": "ExtendedConfigurationObject", "xr:State": "Notify" },
      { "xr:Property": "Format", "xr:State": "Notify" },
    ])
    expect(outputs.get("body")).toEqual({})
  })

  it("writes tagged type parts as one MultiState property", () => {
    const outputs = new Map<string, Record<string, unknown>>([["metadata", {
      Properties: { Type: ["Дата", "Булево"] },
    }]])
    const yamlType = ["Дата", "Булево"]
    markYAMLScalarTag(yamlType, 1, "изменять")
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {}, variant: "adopted" }),
      rule: {
        itemType: "MetadataAttribute",
        properties: {
          type: { type: "TypeDescription", yaml: "Тип", xml: "Type", xmlParents: ["Properties"] },
        },
      } as MetadataItemRule,
      yaml: { Тип: yamlType },
      outputs,
      logicalAddress,
    }))

    expect(record(outputs.get("metadata")).InternalInfo).toEqual({
      "xr:PropertyState": [{ "xr:Property": "Type", "xr:State": "MultiState" }],
    })
    expect(record(record(outputs.get("metadata")).Properties).Type).toEqual({
      "_xsi:type": "xr:ExtendedProperty",
      "xr:CheckValue": {
        "_xsi:type": "v8:TypeDescription",
        "v8:Type": "xs:dateTime",
        "v8:DateQualifiers": { "v8:DateFractions": "Date" },
      },
      "xr:ExtendValue": { "_xsi:type": "v8:TypeDescription", "v8:Type": "xs:boolean" },
    })
  })

  it.each([
    [null, undefined],
    [{}, "изменять"],
  ] as const)("writes an empty referenced property from %#", (yamlValue, tag) => {
    const outputs = new Map<string, Record<string, unknown>>([["metadata", { Properties: {} }]])
    const yaml: Record<string, unknown> = { ИзмерениеАдресации: yamlValue }
    if (tag !== undefined) markYAMLScalarTag(yaml, "ИзмерениеАдресации", tag)
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([clearedReferencePropertyStateCapabilities]),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {} }),
      rule: clearedReferenceRule,
      yaml,
      outputs,
      logicalAddress,
    }))

    expect(record(outputs.get("metadata")).Properties).toHaveProperty("AddressingDimension", "")
  })

  it("does not add an absent referenced property", () => {
    const outputs = new Map<string, Record<string, unknown>>([["metadata", { Properties: {} }]])
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([clearedReferencePropertyStateCapabilities]),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {} }),
      rule: clearedReferenceRule,
      yaml: {},
      outputs,
      logicalAddress,
    }))

    expect(record(outputs.get("metadata")).Properties).not.toHaveProperty("AddressingDimension")
  })

  it("orders every PropertyState by the subject registry", () => {
    const outputs = new Map<string, Record<string, unknown>>([["metadata", { Properties: {} }]])
    const yaml = {
      ИмяВИсточникеДанных: "table",
      КлючевыеПоля: ["id"],
      ТолькоЧтение: true,
      Изменять: ["МодульНабораЗаписей", "МодульМенеджера"],
    }
    markYAMLScalarTag(yaml, "ИмяВИсточникеДанных", "проверять")
    markYAMLScalarTag(yaml, "КлючевыеПоля", "проверять")
    markYAMLScalarTag(yaml, "ТолькоЧтение", "проверять")

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([
        ...configurationExtensionPropertyStateProfiles,
        metadataExternalDataSourceTablePropertyStateCapabilities,
      ]),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: { [logicalAddress]: BASE_UUID } }),
      rule: MetadataExternalDataSourceTableRules,
      yaml,
      outputs,
      logicalAddress,
    }))

    expect(record(record(outputs.get("metadata")).InternalInfo)["xr:PropertyState"]).toEqual([
      { "xr:Property": "NameInDataSource", "xr:State": "Notify" },
      { "xr:Property": "KeyFields", "xr:State": "Notify" },
      { "xr:Property": "RecordSetModule", "xr:State": "Extended" },
      { "xr:Property": "ManagerModule", "xr:State": "Extended" },
      { "xr:Property": "ReadOnly", "xr:State": "Notify" },
    ])
  })

  it("orders the adopted catalog service property by its real rules", () => {
    const outputs = new Map([
      [
        "metadata",
        {
          Properties: {
            Name: "Товары",
            Synonym: "Товары",
            Comment: "",
          },
        },
      ],
    ])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { "Catalog.Товары": BASE_UUID },
        extendedLogicalAddresses: ["Catalog.Товары"],
      }),
      rule: MetadataCatalogRules,
      yaml: {},
      outputs,
      logicalAddress: "Catalog.Товары",
    })

    expect(Object.keys(record(record(outputs.get("metadata")).Properties))).toEqual([
      "ObjectBelonging",
      "Name",
      "Synonym",
      "Comment",
      "ExtendedConfigurationObject",
    ])
  })

  it.each([
    ["own", {}],
    ["borrowed", { "Catalog.Товары": BASE_UUID }],
  ] as const)("does not write an explicit state for a plain extended property of an %s object", (_kind, adoptedUuids) => {
    const outputs = new Map([
      ["metadata", { Properties: { Name: "Товары", Synonym: "Новое имя" } }],
    ])
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids, variant: _kind === "own" ? "full" : "adopted" }),
      rule: MetadataCatalogRules,
      yaml: { Синоним: "Новое имя" },
      outputs,
      logicalAddress: "Catalog.Товары",
    }))

    const metadata = record(outputs.get("metadata"))
    if (_kind === "borrowed") expect(metadata.InternalInfo).toEqual({})
    else expect(metadata).not.toHaveProperty("InternalInfo")
  })

  it.each([
    ["присутствует у adopted", "adopted", { Предопределенные: {} }, [{ "xr:Property": "Predefined", "xr:State": "Extended" }]],
    ["присутствует у full", "full", { Предопределенные: {} }, []],
    ["отсутствует у adopted", "adopted", {}, []],
  ] as const)("выводит состояние смысловой коллекции, когда поле %s", (_case, variant, yaml, expectedStates) => {
    const semanticRule = {
      itemType: "SemanticPredefined",
      properties: {
        predefined: { type: "Predefined", yaml: "Предопределенные", xml: "Predefined" },
      },
    } as MetadataItemRule
    const contribution = definePropertyStateItemCapabilities(semanticRule, {
      properties: {
        predefined: {
          availability: "borrowed",
          modes: ["extend"],
          representation: "semantic",
        },
      },
    })
    const outputs = new Map<string, Record<string, unknown>>([["metadata", { InternalInfo: {}, Properties: {} }]])

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([contribution]),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: variant === "adopted" ? { [logicalAddress]: BASE_UUID } : {},
        variant,
      }),
      rule: semanticRule,
      yaml,
      outputs,
      logicalAddress,
    }))

    expect(record(record(outputs.get("metadata")).InternalInfo)["xr:PropertyState"] ?? []).toEqual(expectedStates)
  })

  it("places extension root service fields in the platform XML order", () => {
    const outputs = new Map([
      [
        "metadata",
        {
          Properties: {
            Name: "Расширение",
            Comment: "",
            ConfigurationExtensionPurpose: "Customization",
          },
          InternalInfo: {},
        },
      ],
    ])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: { Конфигурация: BASE_UUID } }),
      rule: MetadataConfigurationExtensionRules,
      yaml: {},
      outputs,
      logicalAddress: "Конфигурация",
    })

    expect(Object.keys(record(outputs.get("metadata")))).toEqual(["InternalInfo", "Properties"])
    expect(Object.keys(record(record(outputs.get("metadata")).Properties))).toEqual([
      "ObjectBelonging",
      "Name",
      "Comment",
      "ConfigurationExtensionPurpose",
      "ExtendedConfigurationObject",
    ])
  })

  it("writes service properties for an addressable root without declared service properties", () => {
    const outputs = new Map([["metadata", { Properties: { Name: "InputField" } }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { "CommonForm.InputField": BASE_UUID },
        extendedLogicalAddresses: ["CommonForm.InputField"],
      }),
      rule: MetadataCommonFormRules,
      yaml: {},
      outputs,
      logicalAddress: "CommonForm.InputField",
    })

    expect(record(outputs.get("metadata")).Properties).toMatchObject({
      ObjectBelonging: "Adopted",
      ExtendedConfigurationObject: BASE_UUID,
    })
  })

  it("does not copy PropertyState markers from the snapshot", () => {
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

    expect(testContext.exportToXML.configurationIndex!.collector.fragment("Форма.yaml").entities).toEqual([])
  })

  it("writes a section state for a virtual external property", () => {
    const outputs = new Map<string, Record<string, unknown>>([["metadata", { Form: { Properties: {} } }]])
    const contribution = definePropertyStateItemCapabilities(rule, {
      properties: externalProperty("form", "Форма", ["extend"]),
    })
    withOperationRegistrySet({ propertyStates: createPropertyStateCapabilityRegistry([contribution]) }, () =>
      configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: { [logicalAddress]: BASE_UUID } }),
      rule,
      yaml: { Изменять: ["Форма"] },
      outputs,
      logicalAddress,
    }))

    expect(record(record(record(outputs.get("metadata")).Form).InternalInfo)["xr:PropertyState"])
      .toContainEqual({ "xr:Property": "Form", "xr:State": "Extended" })
  })

  it("does not mark an own address as adopted", () => {
    const outputs = new Map([["metadata", { Form: { Properties: {} } }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {}, variant: "full" }),
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

  it("rejects an enabled extension root without a base UUID", () => {
    const outputs = new Map([["metadata", { Properties: {} }]])
    expect(() => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {} }),
      rule: MetadataConfigurationExtensionRules,
      yaml: {},
      outputs,
      logicalAddress: "Конфигурация",
    })).toThrow("Не найден UUID основной конфигурации: Конфигурация")
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
    expect(testContext.exportToXML.configurationIndex!.collector.fragment("Конфигурация.yaml").entities).toEqual([])
  })

  it.each([
    { uuidPresent: true, mode: "control" },
    { uuidPresent: false, mode: "control" },
    { uuidPresent: true, mode: "notify" },
    { uuidPresent: false, mode: "notify" },
  ] as const)("writes ExtendedConfigurationObject: $uuidPresent $mode", (state) => {
    const outputs = new Map<string, Record<string, unknown>>([["metadata", { Properties: {} }]])
    const yaml: Record<string, unknown> = {}
    writeExtendedConfigurationObjectYAML(yaml, state)

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: state.uuidPresent ? { Конфигурация: BASE_UUID } : {},
      }),
      rule: MetadataConfigurationExtensionRules,
      yaml,
      outputs,
      logicalAddress: "Конфигурация",
    }))

    expect(record(outputs.get("metadata")).Properties).toEqual({
      ObjectBelonging: "Adopted",
      ...(state.uuidPresent ? { ExtendedConfigurationObject: BASE_UUID } : {}),
    })
    const states = record(record(outputs.get("metadata")).InternalInfo)["xr:PropertyState"]
    expect(states).toEqual(state.mode === "notify"
      ? [{ "xr:Property": "ExtendedConfigurationObject", "xr:State": "Notify" }]
      : undefined)
  })

  it("does not restore owner InternalInfo into an external XML file", () => {
    const outputs = new Map([["metadata", { Properties: { Name: "Русский" } }]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: { [logicalAddress]: BASE_UUID },
        internalInfoPresent: true,
      }),
      rule: {
        itemType: "ExternalProperties",
        properties: {
          xmlRoot: {
            type: "XMLRoot",
            container: "ExternalProperties",
            rootAttributes: {},
            forReferenceOnly: true,
            isFileRoot: true,
          },
        },
      },
      yaml: {},
      outputs,
      logicalAddress,
    })

    expect(record(outputs.get("metadata"))).not.toHaveProperty("InternalInfo")
  })

  it("does not restore empty InternalInfo from snapshot", () => {
    const outputs = new Map([[
      "metadata",
      { Properties: { Name: "Код" } },
    ]])
    configurationExtensionYamlToXmlAugmenter.augment({
      context: context({
        adoptedUuids: {},
        internalInfoPresent: true,
        variant: "full",
      }),
      rule: {
        itemType: "MetadataAttribute",
        properties: {
          objectBelonging: {
            type: "string",
            xml: "ObjectBelonging",
            xmlParents: ["Properties"],
          },
        },
      } as MetadataItemRule,
      yaml: {},
      outputs,
      logicalAddress,
    })

    expect(record(outputs.get("metadata"))).toEqual({ Properties: { Name: "Код" } })
  })

  it("создаёт пустой InternalInfo для заимствованного объекта с реестром состояний", () => {
    const borrowedRule = {
      itemType: "BorrowedProbe",
      properties: {
        uuid: { type: "UUID", xml: "_uuid", forReferenceOnly: true },
        name: { type: "string", xml: "Name", xmlParents: ["Properties"] },
      },
    } as const satisfies MetadataItemRule
    const contribution = definePropertyStateItemCapabilities(borrowedRule, {
      properties: {},
    })
    const outputs = new Map([["metadata", { Properties: { Name: "Код" } }]])

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([contribution]),
    }, () => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: { [logicalAddress]: BASE_UUID } }),
      rule: borrowedRule,
      yaml: {},
      outputs,
      logicalAddress,
    }))

    expect(record(outputs.get("metadata"))).toMatchObject({
      InternalInfo: {},
      Properties: { Name: "Код" },
    })
  })

  it("не поддерживает старый раздел Контроль", () => {
    expect(() =>
      configurationExtensionYamlToXmlAugmenter.augment({
        context: context({ adoptedUuids: {} }),
        rule,
        yaml: { Контроль: ["Неизвестное"] },
        outputs: new Map([["metadata", { Form: { Properties: {} } }]]),
        logicalAddress,
      })
    ).toThrow(`YAML-поле Контроль больше не поддерживается: ${logicalAddress}`)
  })

  it("rejects Notify when a section property only supports Extended", () => {
    const outputs = new Map([["metadata", { Form: { Properties: {} } }]])
    const yaml = { Форма: {} }
    markYAMLScalarTag(yaml, "Форма", "проверять")
    expect(() => configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: { [logicalAddress]: BASE_UUID }, extended: ["form"] }),
      rule,
      yaml,
      outputs,
      logicalAddress,
    })).toThrow("ClientApplicationForm.form=Notify")
  })

  it("restores Extended for a property declared in the YAML section", () => {
    const outputs = new Map([["metadata", { InternalInfo: {}, Properties: {} }]])
    const moduleRule = {
      itemType: "MetadataCommonModule",
      properties: {
        module: {
          type: "Module",
          xmlPath: "Ext/Module.bsl",
        },
      },
    } as const satisfies MetadataItemRule
    const contribution = definePropertyStateItemCapabilities(moduleRule, {
      properties: externalProperty("module", "Модуль", ["extend"]),
    })
    withOperationRegistrySet({ propertyStates: createPropertyStateCapabilityRegistry([contribution]) }, () =>
      configurationExtensionYamlToXmlAugmenter.augment({
      context: context({ adoptedUuids: {}, extended: ["module"] }),
      rule: moduleRule,
      yaml: { Изменять: ["Модуль"] },
      outputs,
      logicalAddress,
    }))

    expect(record(record(outputs.get("metadata")).InternalInfo)["xr:PropertyState"]).toEqual([
      { "xr:Property": "Module", "xr:State": "Extended" },
    ])
  })
})

function context(params: {
  adoptedUuids: Readonly<Record<string, string>>
  variant?: "full" | "adopted"
  extended?: readonly string[]
  extendedLogicalAddresses?: readonly string[]
  internalInfoPresent?: true
}): ConfigurationContextWithExportToXML {
  return {
    version: "2.20",
    languages: mockLanguages,
    exportToXML: {
      version: "2.20",
      itemsTree: [],
      adoptedUuids: params.adoptedUuids,
      xmlDefaultVariantByLogicalAddress: {
        ...Object.fromEntries(Object.keys(params.adoptedUuids).map((address) => [address, "adopted"] as const)),
        [logicalAddress]: params.variant ?? "adopted",
      },
      componentKind: "configurationExtension",
      configurationIndex: createConfigurationIndexExportRuntime({
        source: testConfigurationIndexReader(),
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
