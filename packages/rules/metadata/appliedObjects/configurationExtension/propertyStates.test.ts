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
import { createPropertyStateCapabilityRegistry } from "./propertyStateCapabilities"
import { metadataCatalogPropertyStateCapabilities } from "../metadataCatalog/propertyStates"
import { configurationExtensionPropertyStateProfiles } from "./propertyStateProfiles"

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

  it("переносит известный недопустимый Extended через !xml", () => {
    const yaml: Record<string, unknown> = { Иерархический: true }
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
    ["ClientApplicationForm", "Form", "form"],
    ["MetadataCommonForm", "Form", "form"],
    ["MetadataCommonModule", "Module", "module"],
    ["MetadataRole", "Rights", "rights"],
    ["MetadataConfigurationExtension", "CommandInterface", "commandInterface"],
    ["MetadataConfigurationExtension", "HomePageWorkArea", "homePageWorkArea"],
    ["MetadataConfigurationExtension", "Logo", "logo"],
    ["MetadataConfigurationExtension", "MainSectionCommandInterface", "mainSectionCommandInterface"],
    ["MetadataConfigurationExtension", "MainSectionPicture", "mainSectionPicture"],
    ["MetadataConfigurationExtension", "Splash", "splash"],
  ] as const)("сохраняет Extended для %s.%s в сегмент %s", (itemType, property, segment) => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const yaml: Record<string, unknown> = {}

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, logicalAddress),
      rule: { itemType, properties: {} } as MetadataItemRule,
      source: propertyStates([property, "Extended"]),
      yaml,
    })

    expect(collector.fragment("Форма.yaml").entities).toEqual(expect.arrayContaining([
      {
        logicalAddress: `${logicalAddress}.${segment}`,
        sourceProjectPath: "Форма.yaml",
        xml: { extended: true },
      },
    ]))
    expect(collector.fragment("Форма.yaml").entities).toHaveLength(2)
    expect(yaml).not.toHaveProperty("Контроль")
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

  it("сохраняет расширяемый объект как xml.extended", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Конфигурация"

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, logicalAddress),
      rule: { itemType: "MetadataConfigurationExtension", properties: {} } as MetadataItemRule,
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
  logicalAddress = "Конфигурация"
) {
  const base = {
    ...mockContextFromXML(),
    fromXML: {
      ...mockContextFromXML().fromXML,
      metadataItemAugmenter: "configurationExtension",
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
