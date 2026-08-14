import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import {
  createConfigurationIndexCollector,
  withConfigurationIndexCollector,
} from "@nkdk/runtime"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import { configurationExtensionPropertyStatesAugmenter } from "./propertyStates"
import { yamlScalarTagAt } from "@nkdk/runtime"
import { withOperationRegistrySet } from "../../operations/operationExecutionContext"
import { createPropertyStateCapabilityRegistry, definePropertyStateItemCapabilities, externalProperty } from "./propertyStateCapabilities"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { configurationExtensionPropertyStateCapabilities } from "./propertyStateRules"
import { clearedReferencePropertyStateCapabilities, clearedReferenceRule } from "./clearedReference.testFixture"
import { MetadataAccountingRegisterDimensionRules } from "../metadataAccountingRegister/childRules"
import { MetadataAttributeRules } from "../../commonObjects/metadataAttribute/rules"
import { MetadataTaskAddressingAttributeRules } from "../../commonObjects/metadataTaskAddressingAttribute/rules"

describe("configuration extension PropertyState augmenter", () => {
  it.each([
    ["synonym", "Синоним", "Synonym", undefined, ""],
    ["defaultListForm", "ОсновнаяФормаСписка", "DefaultListForm", undefined, ""],
    ["objectPresentation", "ПредставлениеОбъекта", "ObjectPresentation", undefined, ""],
    ["owners", "Владельцы", "Owners", "MetadataObjectRefCollection", []],
    ["content", "Содержимое", "Content", "MetadataItemLinks", []],
    ["commonAttributeContent", "Состав", "Content", "CommonAttributeContent", []],
    ["type", "Тип", "Type", "TypeDescription", []],
  ] as const)(
    "сохраняет присутствующее пустое plain-свойство %s и отличает его от отсутствующего",
    (propertyKey, yamlName, xmlName, type, emptyYAML) => {
      const propertyRule = {
        type: type ?? "string",
        yaml: yamlName,
        xml: xmlName,
        xmlParents: ["Properties"],
      }
      const rule = {
        itemType: `Plain${propertyKey}`,
        properties: { [propertyKey]: propertyRule },
      } as MetadataItemRule
      const contribution = definePropertyStateItemCapabilities(rule, {
        properties: { [propertyKey]: { availability: "borrowed", modes: ["extend"], representation: "plain" } },
      })
      const present: Record<string, unknown> = {}
      const absent: Record<string, unknown> = {}

      withOperationRegistrySet({
        propertyStates: createPropertyStateCapabilityRegistry([contribution]),
      }, () => {
        configurationExtensionPropertyStatesAugmenter.augment({
          context: extensionContext(),
          rule,
          source: { Properties: { ObjectBelonging: "Adopted", [xmlName]: undefined } },
          yaml: present,
        })
        configurationExtensionPropertyStatesAugmenter.augment({
          context: extensionContext(),
          rule,
          source: { Properties: { ObjectBelonging: "Adopted" } },
          yaml: absent,
        })
      })

      expect(present).toEqual({ [yamlName]: emptyYAML })
      expect(absent).toEqual({})
    },
  )

  it("не переносит plain-свойство собственного объекта расширения", () => {
    const rule = {
      itemType: "OwnPlainItem",
      properties: {
        synonym: { type: "I8nText", yaml: "Синоним", xml: "Synonym", xmlParents: ["Properties"] },
      },
    } as MetadataItemRule
    const yaml: Record<string, unknown> = {}

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([
        definePropertyStateItemCapabilities(rule, {
          properties: { synonym: { availability: "borrowed", modes: ["extend"], representation: "plain" } },
        }),
      ]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule,
      source: { Properties: { Synonym: "Собственный" } },
      yaml,
    }))

    expect(yaml).toEqual({})
  })

  it("не переносит пустое собственное свойство заимствованного объекта", () => {
    const rule = {
      itemType: "OwnPropertyOfBorrowedItem",
      properties: {
        comment: { type: "string", yaml: "Комментарий", xml: "Comment", xmlParents: ["Properties"] },
      },
    } as MetadataItemRule
    const yaml: Record<string, unknown> = {}

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([
        definePropertyStateItemCapabilities(rule, {
          properties: { comment: { availability: "own", modes: [], representation: "plain" } },
        }),
      ]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule,
      source: { Properties: { ObjectBelonging: "Adopted", Comment: undefined } },
      yaml,
    }))

    expect(yaml).toEqual({})
  })

  it("сохраняет присутствующее пустое tagged-свойство без PropertyState", () => {
    const rule = {
      itemType: "TaggedFormat",
      properties: {
        format: { type: "string", yaml: "Формат", xml: "Format", xmlParents: ["Properties"] },
      },
    } as const satisfies MetadataItemRule
    const yaml: Record<string, unknown> = {}

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([
        definePropertyStateItemCapabilities(rule, {
          properties: {
            format: { availability: "borrowed", modes: ["control", "notify", "extend"], representation: "tagged" },
          },
        }),
      ]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule,
      source: { Properties: { ObjectBelonging: "Adopted", Format: "" } },
      yaml,
    }))

    expect(yaml).toEqual({ Формат: "" })
    expect(yamlScalarTagAt(yaml, "Формат")).toBeUndefined()
  })

  it.each([
    ["Notify", "проверять"],
    ["Extended", "изменять"],
  ] as const)("сохраняет очищенную ссылку с состоянием %s", (state, tag) => {
    const yaml: Record<string, unknown> = { ИзмерениеАдресации: null }

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([clearedReferencePropertyStateCapabilities]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: clearedReferenceRule,
      source: {
        ...propertyStates(["AddressingDimension", state]),
        Properties: { AddressingDimension: undefined },
      },
      yaml,
    }))

    expect(yaml.ИзмерениеАдресации).toEqual({})
    expect(yamlScalarTagAt(yaml, "ИзмерениеАдресации")).toBe(tag)
  })

  it("сохраняет обычный Type с Notify без требования xr:ExtendedProperty", () => {
    const yaml: Record<string, unknown> = { Тип: "СправочникСсылка.СправочникСПредопределенными" }

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: MetadataAttributeRules,
      source: {
        ...propertyStates(["Type", "Notify"]),
        Properties: { Type: { "v8:Type": "cfg:CatalogRef.СправочникСПредопределенными" } },
      },
      yaml,
    }))

    expect(yamlScalarTagAt(yaml, "Тип")).toBe("проверять")
  })

  it("принимает Extended для измерения адресации задачи", () => {
    const yaml: Record<string, unknown> = { ИзмерениеАдресации: null }

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: MetadataTaskAddressingAttributeRules,
      source: {
        ...propertyStates(["AddressingDimension", "Extended"]),
        Properties: { AddressingDimension: undefined },
      },
      yaml,
    }))

    expect(yaml.ИзмерениеАдресации).toEqual({})
    expect(yamlScalarTagAt(yaml, "ИзмерениеАдресации")).toBe("изменять")
  })
  it("записывает снятый флажок заимствованного объекта как Ложь", () => {
    const yaml: Record<string, unknown> = {}

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: MetadataCatalogRules,
      source: { Properties: { ObjectBelonging: "Adopted" } },
      yaml,
    })

    expect(yaml).toEqual({ ОбъектРасширяемойКонфигурации: "Ложь" })
  })

  it("не записывает включённый флажок без Notify в YAML", () => {
    const yaml: Record<string, unknown> = {}

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: MetadataCatalogRules,
      source: {
        Properties: {
          ObjectBelonging: "Adopted",
          ExtendedConfigurationObject: "11111111-1111-4111-8111-111111111111",
        },
      },
      yaml,
    })

    expect(yaml).toEqual({})
  })

  it("преобразует Notify по каноническому XML-имени builder-rule без явного xml", () => {
    const yaml: Record<string, unknown> = { РежимСовместимости: "Version8_3_27" }
    const testRule = {
      itemType: "MetadataConfigurationExtension",
      properties: {
        compatibilityMode: systemEnumerationRule({
          yaml: "РежимСовместимости",
          typeSE: "CompatibilityMode",
        }),
        extendedConfigurationObject: { type: "string", runtimeOnly: true },
      },
    } as MetadataItemRule
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry([
        definePropertyStateItemCapabilities(testRule, {
          properties: {
            compatibilityMode: { availability: "borrowed", modes: ["control", "notify"], representation: "tagged" },
            extendedConfigurationObject: { availability: "borrowed", modes: ["control", "notify"], representation: "tagged" },
          },
        }),
      ]),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
        context: extensionContext(),
        rule: testRule,
        source: propertyStates([
          ["CompatibilityMode", "Notify"],
          ["ExtendedConfigurationObject", "Notify"],
        ]),
        yaml,
      }))

    expect(yaml).toEqual({
      РежимСовместимости: "Version8_3_27",
      ОбъектРасширяемойКонфигурации: {},
    })
    expect(yamlScalarTagAt(yaml, "РежимСовместимости")).toBe("проверять")
    expect(yamlScalarTagAt(yaml, "ОбъектРасширяемойКонфигурации")).toBe("проверять")
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

  it.each([
    [true, "Истина"],
    [false, "Ложь"],
  ] as const)("сохраняет Balance=%s с !проверять", (xmlValue, yamlValue) => {
    const yaml: Record<string, unknown> = {}

    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: MetadataAccountingRegisterDimensionRules,
      source: {
        ...propertyStates(["Balance", "Notify"]),
        Properties: { Balance: xmlValue },
      },
      yaml,
    }))

    expect(yaml.Балансовый).toBe(yamlValue)
    expect(yamlScalarTagAt(yaml, "Балансовый")).toBe("проверять")
  })

  it("отклоняет !изменять для Balance", () => {
    expect(() => withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(),
      rule: MetadataAccountingRegisterDimensionRules,
      source: {
        ...propertyStates(["Balance", "Extended"]),
        Properties: { Balance: true },
      },
      yaml: {},
    }))).toThrow("MetadataRegisterDimension.Balance=Extended")
  })

  it.each([
    ["Hierarchical", "Extended", "MetadataCatalog.Hierarchical=Extended"],
    ["DefaultListForm", "Notify", "MetadataCatalog.DefaultListForm=Notify"],
    ["CodeLength", "MultiState", "MetadataCatalog.CodeLength=MultiState"],
    ["UnknownLength", "Extended", "MetadataCatalog.UnknownLength=Extended"],
    ["CodeLength", "Checked", "MetadataCatalog.CodeLength=Checked"],
    ["CodeLength", "NotSet", "MetadataCatalog.CodeLength=NotSet"],
    ["CodeLength", "FutureState", "MetadataCatalog.CodeLength=FutureState"],
  ])("отклоняет неподдерживаемый PropertyState %s=%s", (xmlProperty, state, message) => {
    withOperationRegistrySet({
      propertyStates: createPropertyStateCapabilityRegistry(configurationExtensionPropertyStateCapabilities),
    }, () => expect(() => configurationExtensionPropertyStatesAugmenter.augment({
        context: extensionContext(),
        rule: MetadataCatalogRules,
        source: {
          ...propertyStates([xmlProperty, state]),
          Properties: { [xmlProperty]: 9 },
        },
        yaml: {},
      })).toThrow(message))
  })

  it("отклоняет Extended, недоступный в режиме совместимости расширения", () => {
    const yaml: Record<string, unknown> = { ДлинаКода: 9 }
    expect(() => withOperationRegistrySet({
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
      }))).toThrow("MetadataCatalog.CodeLength=Extended")
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

  it("отклоняет незарегистрированный режим вынесенного свойства", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Товары.Команда.Печать"
    const yaml: Record<string, unknown> = {}

    expect(() => configurationExtensionPropertyStatesAugmenter.augment({
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
    })).toThrow("UnregisteredMetadataCommand.CommandModule=Extended")

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

  it("не сохраняет присутствие ExtendedConfigurationObject в тонком снимке", () => {
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

    expect(collector.fragment("Форма.yaml").entities).toEqual([])
  })

  it("не сохраняет присутствие InternalInfo в тонком снимке", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Товары.Реквизит.Код"

    configurationExtensionPropertyStatesAugmenter.augment({
      context: extensionContext(collector, logicalAddress),
      rule: { itemType: "MetadataAttribute", properties: {} } as MetadataItemRule,
      source: { InternalInfo: {}, Properties: { Name: "Код" } },
      yaml: {},
    })

    expect(collector.fragment("Форма.yaml").entities).toEqual([])
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
