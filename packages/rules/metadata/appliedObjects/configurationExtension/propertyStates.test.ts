import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import {
  childSegmentUid,
  createConfigurationIndexCollector,
  withConfigurationIndexCollector,
} from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { configurationExtensionPropertyStatesAugmenter } from "./propertyStates"
import { yamlScalarTagAt } from "@nkdk/runtime"
import { withOperationRegistrySet } from "../../operations/operationExecutionContext"
import { createPropertyStateCapabilityRegistry, definePropertyStateItemCapabilities, externalProperty } from "./propertyStateCapabilities"
import { metadataCatalogPropertyStateCapabilities } from "../metadataCatalog/propertyStates"
import { configurationExtensionPropertyStateProfiles } from "./propertyStateProfiles"
import { configurationExtensionPropertyStateCapabilities } from "./propertyStateRules"

describe("configuration extension PropertyState augmenter", () => {
  it("преобразует Notify по каноническому XML-имени builder-rule без явного xml", () => {
    const yaml: Record<string, unknown> = { ОсновнойРежимЗапуска: "ManagedApplication" }
    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: {
        itemType: "MetadataConfigurationExtension",
        properties: {
          defaultRunMode: systemEnumerationRule({
            yaml: "ОсновнойРежимЗапуска",
            typeSE: "ClientRunMode",
          }),
        },
      },
      source: propertyStates([
        ["DefaultRunMode", "Notify"],
        ["ExtendedConfigurationObject", "Notify"],
        ["DefaultRunMode", "Notify"],
        ["Unknown", "Notify"],
      ]),
      yaml,
    })

    expect(yaml).toEqual({
      ОсновнойРежимЗапуска: "ManagedApplication",
      ОбъектРасширяемойКонфигурации: {},
    })
    expect(yamlScalarTagAt(yaml, "ОсновнойРежимЗапуска")).toBe("проверять")
    expect(yamlScalarTagAt(yaml, "ОбъектРасширяемойКонфигурации")).toBe("проверять")

    const singleYaml: Record<string, unknown> = {}
    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: { itemType: "SingleState", properties: {} },
      source: propertyStates(["ExtendedConfigurationObject", "Notify"]),
      yaml: singleYaml,
    })
    expect(singleYaml).toEqual({ ОбъектРасширяемойКонфигурации: {} })
    expect(yamlScalarTagAt(singleYaml, "ОбъектРасширяемойКонфигурации")).toBe("проверять")
  })

  it("преобразует скалярный Extended в !изменять", () => {
    const yaml: Record<string, unknown> = { ДлинаКода: 9 }
    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: { itemType: "MetadataCatalog", properties: { codeLength: { type: "number", yaml: "ДлинаКода", xml: "CodeLength" } } } as MetadataItemRule,
      source: propertyStates(["CodeLength", "Extended"]),
      yaml,
    })
    expect(yamlScalarTagAt(yaml, "ДлинаКода")).toBe("изменять")
  })

  it.each([
    ["Extended", "изменять"],
    ["Notify", "проверять"],
  ] as const)("сохраняет неявное значение свойства с состоянием %s", (state, tag) => {
    const yaml: Record<string, unknown> = {}
    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: {
        itemType: "MetadataTask",
        properties: {
          numberLength: {
            type: "number",
            yaml: "ДлинаНомера",
            xml: "NumberLength",
            xmlParents: ["Properties"],
            implicitValueYAML: 9,
            defaultValueXML: 9,
          },
        },
      } as MetadataItemRule,
      source: {
        ...propertyStates(["NumberLength", state]),
        Properties: { NumberLength: 9 },
      },
      yaml,
    })

    expect(yaml.ДлинаНомера).toBe(9)
    expect(yamlScalarTagAt(yaml, "ДлинаНомера")).toBe(tag)
  })

  it("переносит известный недопустимый Extended через !xml", () => {
    const yaml: Record<string, unknown> = { Иерархический: true }
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
        context: extensionContext(),
        rule: {
          itemType: "MetadataCatalog",
          properties: {
            hierarchical: { type: "boolean", yaml: "Иерархический", xml: "Hierarchical", xmlParents: ["Properties"] },
          },
        },
        source: {
          ...propertyStates(["Hierarchical", "Extended"]),
          Properties: { Hierarchical: true },
        },
        yaml,
      }))

    expect(yamlScalarTagAt(yaml, "Иерархический")).toBe("xml")
    expect(yaml.Иерархический).toMatch(/^!xml configurationExtensionPropertyStateXML:/u)
  })

  it("переносит через !xml свойство, отсутствующее в зарегистрированной матрице вида", () => {
    const yaml: Record<string, unknown> = { ДлинаКода: 9 }
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([
        ...configurationExtensionPropertyStateProfiles,
        metadataCatalogPropertyStateCapabilities,
      ]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: {
        itemType: "MetadataCatalog",
        properties: {
          unknownLength: { type: "number", yaml: "ДлинаКода", xml: "UnknownLength", xmlParents: ["Properties"] },
        },
      } as MetadataItemRule,
      source: {
        ...propertyStates(["UnknownLength", "Extended"]),
        Properties: { UnknownLength: 9 },
      },
      yaml,
    }))

    expect(yamlScalarTagAt(yaml, "ДлинаКода")).toBe("xml")
  })

  it("учитывает режим совместимости расширения при импорте известного Extended", () => {
    const yaml: Record<string, unknown> = { ДлинаКода: 9 }
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(undefined, "Конфигурация", "Version8_3_7"),
      rule: {
        itemType: "MetadataCatalog",
        properties: {
          codeLength: { type: "number", yaml: "ДлинаКода", xml: "CodeLength", xmlParents: ["Properties"] },
        },
      } as MetadataItemRule,
      source: {
        ...propertyStates(["CodeLength", "Extended"]),
        Properties: { CodeLength: 9 },
      },
      yaml,
    }))

    expect(yamlScalarTagAt(yaml, "ДлинаКода")).toBe("xml")
  })

  it("заменяет Type/xr:ExtendedProperty составным YAML-типом", () => {
    const yaml: Record<string, unknown> = {}
    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: {
        itemType: "MetadataAttribute",
        properties: {
          type: { type: "TypeDescription", yaml: "Тип", xml: "Type", xmlParents: ["Properties"] },
        },
      } as MetadataItemRule,
      source: {
        ...propertyStates(["Type", "MultiState"]),
        Properties: {
          Type: {
            "_xsi:type": "xr:ExtendedProperty",
            "xr:CheckValue": { "_xsi:type": "v8:TypeDescription", "v8:Type": "xs:dateTime" },
            "xr:ExtendValue": { "_xsi:type": "v8:TypeDescription", "v8:Type": "xs:boolean" },
          },
        },
      },
      yaml,
    })

    expect(yaml.Тип).toEqual(["Дата", "Булево"])
    expect(yamlScalarTagAt(yaml.Тип, 1)).toBe("изменять")
  })

  it.each([
    ["ClientApplicationForm", "Form", "form", "Форма"],
    ["MetadataCommonForm", "Form", "form", "Форма"],
    ["MetadataCommonModule", "Module", "module", "Модуль"],
    ["MetadataRole", "Rights", "rights", "Права"],
    ["MetadataConfigurationExtension", "CommandInterface", "commandInterface", "КомандныйИнтерфейс"],
    ["MetadataConfigurationExtension", "HomePageWorkArea", "homePageWorkArea", "РабочаяОбластьНачальнойСтраницы"],
    ["MetadataConfigurationExtension", "Logo", "logo", "Логотип"],
    ["MetadataConfigurationExtension", "MainSectionCommandInterface", "mainSectionCommandInterface", "КомандныйИнтерфейсОсновногоРаздела"],
    ["MetadataConfigurationExtension", "MainSectionPicture", "mainSectionPicture", "КартинкаОсновногоРаздела"],
    ["MetadataConfigurationExtension", "Splash", "splash", "Заставка"],
  ] as const)("сохраняет Extended для %s.%s в YAML-раздел", (itemType, property, propertyKey, externalName) => {
    const logicalAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const yaml: Record<string, unknown> = {}
    const contribution = definePropertyStateItemCapabilities({
      itemType,
      properties: { [propertyKey]: { type: "string", xml: property } },
    } as MetadataItemRule, {
      properties: externalProperty(propertyKey, externalName, ["extend"]),
    })
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([contribution]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
        context: extensionContext(undefined, logicalAddress),
        rule: { itemType, properties: { [propertyKey]: { type: "string", xml: property } } } as MetadataItemRule,
        source: propertyStates([property, "Extended"]),
        yaml,
      }))

    expect(yaml).toEqual({ Изменять: [externalName] })
    expect(yaml).not.toHaveProperty("Контроль")
  })

  it("сохраняет вынесенное свойство, которого нет среди смысловых properties", () => {
    const yaml: Record<string, unknown> = {}
    const rule = { itemType: "VirtualExternal", properties: {} } as MetadataItemRule
    const contribution = definePropertyStateItemCapabilities(rule, {
      properties: externalProperty("form", "Форма", ["extend"]),
    })

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([contribution]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule,
      source: propertyStates(["Form", "Extended"]),
      yaml,
    }))

    expect(yaml).toEqual({ Изменять: ["Форма"] })
  })

  it("не сохраняет незарегистрированный режим вынесенного свойства в снимок", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Товары.Команда.Печать"
    const yaml: Record<string, unknown> = {}

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, logicalAddress),
      rule: {
        itemType: "UnregisteredMetadataCommand",
        properties: {
          commandModule: {
            type: "Module",
            externalMetadata: { segment: "CommandModule", placement: "derivedEntry" },
            xmlPath: "Commands/Печать/Ext/CommandModule.bsl",
          },
        },
      } as MetadataItemRule,
      source: propertyStates(["CommandModule", "Extended"]),
      yaml,
    })

    expect(collector.fragment("Форма.yaml").entities).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ xml: { extended: true } }),
    ]))
    expect(yaml).toEqual({})
  })

  it("записывает режим вынесенного составного свойства конфигурации в раздел", () => {
    const logicalAddress = "Конфигурация"
    const commandInterface = { ВидимостьПодсистем: { "Subsystem.Товары": { Общее: false } } }
    const yaml: Record<string, unknown> = { КомандныйИнтерфейс: commandInterface }

    const rule = {
        itemType: "MetadataConfigurationExtension",
        properties: {
          commandInterface: {
            type: "RootCommandInterface",
            xml: "CommandInterface",
            yaml: "КомандныйИнтерфейс",
          },
        },
      } as MetadataItemRule
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([
        definePropertyStateItemCapabilities(rule, {
          properties: externalProperty("commandInterface", "КомандныйИнтерфейс", ["extend"]),
        }),
      ]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
        context: extensionContext(undefined, logicalAddress),
        rule,
        source: propertyStates(["CommandInterface", "Extended"]),
        yaml,
      }))

    expect(yaml.КомандныйИнтерфейс).toBe(commandInterface)
    expect(yamlScalarTagAt(yaml, "КомандныйИнтерфейс")).toBeUndefined()
    expect(yaml.Изменять).toEqual(["КомандныйИнтерфейс"])
  })

  it("отклоняет неизвестное значение PropertyState", () => {
    const collector = createConfigurationIndexCollector()
    const yaml: Record<string, unknown> = {}

    expect(() => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, "Справочник.Товары"),
      rule: { itemType: "UnknownItem", properties: {} } as MetadataItemRule,
      source: propertyStates([
        ["Form", "Extended"],
        ["Unknown", "Extended"],
        ["Form", "FutureState"],
      ]),
      yaml,
    })).toThrow("Неизвестное значение PropertyState FutureState для UnknownItem.Form")
  })

  it("сохраняет присутствие ExtendedConfigurationObject как xml.extended у любого metadata-item", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Конфигурация"

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, logicalAddress),
      rule: { itemType: "MetadataAttribute", properties: {} } as MetadataItemRule,
      source: {
        Properties: {
          ObjectBelonging: "Adopted",
          ExtendedConfigurationObject: "11111111-1111-4111-8111-111111111111",
        },
      },
      yaml: {},
    })

    expect(collector.fragment("Форма.yaml").entities).toEqual([
      {
        logicalAddress,
        sourceProjectPath: "Форма.yaml",
        xml: { extended: true },
      },
    ])
  })

  it("сохраняет присутствие InternalInfo у metadata-item", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Товары.Реквизит.Код"

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, logicalAddress),
      rule: { itemType: "MetadataAttribute", properties: {} } as MetadataItemRule,
      source: { InternalInfo: {}, Properties: { Name: "Код" } },
      yaml: {},
    })

    expect(collector.fragment("Форма.yaml").entities).toEqual([
      {
        logicalAddress: childSegmentUid(logicalAddress, "InternalInfo"),
        sourceProjectPath: "Форма.yaml",
        xml: { present: true },
      },
    ])
  })

  it("не сохраняет присутствие и порядок служебных свойств", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Товары"

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, logicalAddress),
      rule: {
        itemType: "Catalog",
        properties: {
          name: {
            type: "string",
            xml: "Name",
            xmlParents: ["Properties"],
          },
          type: {
            type: "string",
            xml: "Type",
            xmlParents: ["Properties"],
          },
        },
      },
      source: {
        Properties: {
          ObjectBelonging: "Adopted",
          Name: "Товары",
          Type: "String",
        },
      },
      yaml: {},
    })

    expect(collector.fragment("Свойства.yaml").entities).toEqual([])
  })
})

function extensionContext(
  collector?: ReturnType<typeof createConfigurationIndexCollector>,
  logicalAddress = "Конфигурация",
  propertyStateCompatibilityMode?: string,
) {
  const base = {
    ...mockContextFromXML(),
    fromXML: {
      ...mockContextFromXML().fromXML,
      metadataItemAugmenter: "configurationExtension",
      ...(propertyStateCompatibilityMode === undefined ? {} : { propertyStateCompatibilityMode }),
    },
  }
  return collector === undefined ? base : withConfigurationIndexCollector(base, collector, logicalAddress)
}

function propertyStates(
  states: readonly [property: string, state: string] | readonly (readonly [property: string, state: string])[]
): Record<string, unknown> {
  const normalized = typeof states[0] === "string" ? [states] : states
  const values = normalized.map(([property, state]) => ({
    "xr:Property": property,
    "xr:State": state,
  }))
  return {
    InternalInfo: {
      "xr:PropertyState": values.length === 1 ? values[0] : values,
    },
  }
}
