import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../tests/directConversion"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { convertPropertiesFromYAMLToXML } from "../ruleRuntime/property/fromYAMLToXML"
import type { TypeRulesOperations } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexExportRuntime } from "@nkdk/runtime"
import { importFromYAML } from "@nkdk/runtime"
import type { ConfigurationIndexBlockEntity } from "@nkdk/runtime"
import { registeredExplicitXMLTestRule } from "../../tests/property/explicitXMLPropertyRegistry"
import { TEST_CONFIGURATION_UUID, testConfigurationIndexReader } from "../../tests/configurationIndex"

import "../commonObjects/metadataValue/toXML"
import "../commonObjects/metadataValue/fromXML"
import "../commonObjects/dataCompositionSystem/conditionalAppearance/types"
import "../commonObjects/boolean/fromXML"
import "../commonObjects/boolean/fromYAML"
import "../commonObjects/boolean/toYAML"
import "../commonObjects/i8nText/fromXML"
import "../commonObjects/i8nText/fromYAML"
import "../commonObjects/i8nText/toXML"
import "../commonObjects/i8nText/toYAML"
import "../commonObjects/internalInfo/fromXML"
import "../commonObjects/internalInfo/toXML"
import "../commonObjects/userSettingsID/toXML"
import "../commonObjects/uuid/fromXML"
import "../systemEnumerations/fromXML"
import "../systemEnumerations/fromYAML"
import "../systemEnumerations/toXML"
import "../systemEnumerations/toYAML"

function contextWithIndex(extraEntities: readonly ConfigurationIndexBlockEntity[] = []): {
  context: ConfigurationContextWithExportToXML
  collector: ReturnType<typeof createConfigurationIndexCollector>
} {
  const source = testConfigurationIndexReader([
      {
        logicalAddress: "Справочник.Товары",
        uuid: TEST_CONFIGURATION_UUID,
      },
      ...extraEntities,
    ])
  const collector = createConfigurationIndexCollector()
  const configurationIndex = createConfigurationIndexExportRuntime({
    source,
    collector,
    targetProjectPath: "Справочник/Товары/Свойства.yaml",
    logicalAddress: "Справочник.Товары",
  })
  return {
    collector,
    context: {
      defaultLanguage: "ru",
      version: "2.20",
      exportToXML: {

        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    },
  }
}

function contextWithEmptyIndex(): ConfigurationContextWithExportToXML {
  const source = testConfigurationIndexReader()
  const collector = createConfigurationIndexCollector()
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToXML: {
      version: "2.20",
      itemsTree: [],
      configurationIndex: createConfigurationIndexExportRuntime({
        source,
        collector,
        targetProjectPath: "Справочник/Товары/Свойства.yaml",
        logicalAddress: "Справочник.Товары",
      }),
    },
  }
}

describe("configuration index в едином YAML → XML-обходе", () => {
  it.each([
    ["каноническое значение", "default"],
    ["явное !xml-значение", "explicitXML"],
  ] as const)("экспортирует %s одинаково без снимка и с пустым снимком", (_name, kind) => {
    const rule = kind === "explicitXML"
      ? registeredExplicitXMLTestRule("SnapshotIndependentExplicitXMLProbe")
      : {
          itemType: "SnapshotIndependentDefaultProbe",
          properties: {
            mode: {
              type: "string",
              xml: "Mode",
              yaml: "Режим",
              implicitValueYAML: "Auto",
            },
          },
        } as const satisfies MetadataItemRule
    const yaml = kind === "explicitXML" ? importFromYAML("Режим: !xml/present") : {}
    const withoutSnapshot = testPropertyFromYAMLToXML({ rule, yaml }).xml
    const withEmptySnapshot = testPropertyFromYAMLToXML({
      context: contextWithEmptyIndex(),
      rule,
      yaml,
    }).xml

    expect(withEmptySnapshot).toEqual(withoutSnapshot)
  })

  it("восстанавливает исходный namespace-префикс описания типа без reference XML", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "TypeDescriptionPrefixProbe",
      properties: {
        type: {
          type: "TypeDescription",
          yaml: "Тип",
          xml: "Type",
          declareTypeNamespaceXML: true,
        },
      },
    } as const satisfies MetadataItemRule
    const source = {
      Type: {
        "v8:Type": {
          "_xmlns:d4p1": "http://v8.1c.ru/8.1/data/enterprise/current-config",
          "#text": "d4p1:CatalogRef.ЗначенияХарактеристик",
        },
      },
    }

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: source,
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(exported.xml).toEqual(source)
  })

  it("не восстанавливает необязательное XML-значение только по implicitValueYAML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары",
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
    })
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        mode: {
          type: "string",
          xml: "Mode",
          yaml: "Режим",
          implicitValueYAML: "Auto",
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Mode: "Auto" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({})
  })

  it("не заменяет явно заданный Normal на XML-default QuickAccess", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "DynamicListProbe",
      properties: {
        conditionalAppearance: {
          type: "ConditionalAppearance",
          xml: "dcsset:conditionalAppearance",
          yaml: "УсловноеОформление",
          configurationIndexAddressing: "yamlPath",
        },
      },
    } as const satisfies MetadataItemRule
    const source = {
      "dcsset:conditionalAppearance": {
        "dcsset:viewMode": "Normal",
        "dcsset:userSettingID": "b75fecce-942b-4aed-abc9-e6a02e460fb3",
      },
    }

    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: source,
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({
      УсловноеОформление: {
        ИспользоватьПользовательскуюНастройку: "b75fecce-942b-4aed-abc9-e6a02e460fb3",
        РежимОтображения: "Обычный",
      },
    })
    expect(exported.xml).toEqual(source)
  })

  it("не восстанавливает необязательное логическое XML-значение только по implicitValueYAML", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        enabled: {
          type: "boolean",
          xml: "Enabled",
          yaml: "Включено",
          implicitValueYAML: true,
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Enabled: "true" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({})
  })

  it("восстанавливает XML defaults по rules без признака присутствия", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        mode: {
          type: "string",
          xml: "Mode",
          yaml: "Режим",
          defaultValueXML: "Default",
        },
        enabled: {
          type: "boolean",
          xml: "Enabled",
          yaml: "Включено",
          defaultValueXML: false,
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Mode: "Default", Enabled: "false" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({ Mode: "Default", Enabled: false })
  })

  it("не восстанавливает необязательное перечисление только по implicitValueYAML", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        type: {
          type: "SystemEnumeration",
          typeSE: "FormButtonType",
          xml: "Type",
          yaml: "Вид",
          implicitValueYAML: "UsualButton",
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Type: "UsualButton" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({})
  })

  it("не восстанавливает локализованное implicitValueYAML без XML-default", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        enabled: {
          type: "boolean",
          xml: "Enabled",
          yaml: "Включено",
          implicitValueYAML: "Ложь",
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Enabled: "false" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({})
  })

  it("экспортирует вычисленное значение по умолчанию без удалённого признака присутствия", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        mode: {
          type: "string",
          xml: "Mode",
          yaml: "Режим",
          defaultValue: ({ operation }: { operation: TypeRulesOperations }) =>
            operation === "importFromYAML" ? undefined : "QuickAccess",
        },
        name: { type: "string", xml: "Name", yaml: "Имя" },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Name: "Тест" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({ Режим: "QuickAccess", Имя: "Тест" })
    expect(exported.xml).toEqual({ Mode: "QuickAccess", Name: "Тест" })
  })

  it("сохраняет явно заданное XML-значение, совпадающее с вычисленным значением по умолчанию", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        mode: {
          type: "string",
          xml: "Mode",
          yaml: "Режим",
          defaultValue: ({ operation }: { operation: TypeRulesOperations }) =>
            operation === "importFromYAML" ? undefined : "QuickAccess",
        },
        name: { type: "string", xml: "Name", yaml: "Имя" },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Mode: "QuickAccess", Name: "Тест" },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(exported.xml).toEqual({ Mode: "QuickAccess", Name: "Тест" })
  })

  it("восстанавливает Synonym, исключённый из YAML как равный имени", () => {
    const contexts = createDirectRoundTripContexts()
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        synonym: {
          type: "I8nText",
          xml: "Synonym",
          yaml: "Синоним",
          excludeIfEqualNameYAML: true,
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      name: "РегистрБухгалтерииПоУмолчанию",
      xml: {
        Synonym: {
          "v8:item": {
            "v8:lang": "ru",
            "v8:content": "Регистр бухгалтерии по умолчанию",
          },
        },
      },
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      name: "РегистрБухгалтерииПоУмолчанию",
      yaml: imported.yaml,
    })

    expect(imported.yaml).toEqual({})
    expect(exported.xml).toEqual({
      Synonym: {
        "v8:item": [{
          "v8:lang": "ru",
          "v8:content": "Регистр бухгалтерии по умолчанию",
        }],
      },
    })
  })

  it("uses the rule XML property order when YAML is missing", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары",
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
    })
    const rule = {
      itemType: "TestDirectItem",
      xmlOrder: ["internalInfo", "name", "resources"],
      properties: {
        resources: {
          type: "string",
          xml: "Resource",
          xmlParents: ["ChildObjects"],
          yaml: "Ресурсы",
        },
        name: {
          type: "string",
          xml: "Name",
          xmlParents: ["Properties"],
          yaml: "Имя",
        },
        internalInfo: {
          type: "InternalInfo",
          xml: "InternalInfo",
          forReferenceOnly: true,
          evaluateWhenYAMLMissing: true,
          items: [{ name: "CatalogRef", category: "Ref" }],
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: {
        InternalInfo: {
          "xr:GeneratedType": {
            _name: "CatalogRef.Товары",
            _category: "Ref",
            "xr:TypeId": "00000000-0000-0000-0000-000000000001",
            "xr:ValueId": "00000000-0000-0000-0000-000000000002",
          },
        },
        Properties: { Name: "Товары" },
        ChildObjects: { Resource: "Ресурс1" },
      },
      name: "Товары",
    })
    contexts.importContext.fromXML.configurationIndex?.collector.setIdentity(
      "Справочник.Товары",
      "uuid",
      "00000000-0000-0000-0000-000000000003",
    )
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
      name: "Товары",
    })

    expect(imported.yaml).toEqual({ Имя: "Товары", Ресурсы: "Ресурс1" })
    expect(Object.keys(exported.xml)).toEqual(["InternalInfo", "Properties", "ChildObjects"])
    expect(exported.xml.InternalInfo).toEqual({
      "xr:GeneratedType": [
        {
          _name: "CatalogRef.Товары",
          _category: "Ref",
          "xr:TypeId": "00000000-0000-0000-0000-000000000001",
          "xr:ValueId": "00000000-0000-0000-0000-000000000002",
        },
      ],
    })
    expect(Object.keys(exported.xml.Properties as object)).toEqual(["Name"])
  })

  it("не восстанавливает пустой InternalInfo без предметной структуры", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Catalog.Товары.Attribute.Код",
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
    })
    const rule = {
      itemType: "TestDirectItem",
      xmlOrder: ["internalInfo", "name"],
      properties: {
        internalInfo: {
          type: "InternalInfo",
          xml: "InternalInfo",
          forReferenceOnly: true,
          evaluateWhenYAMLMissing: true,
          items: [],
        },
        name: {
          type: "string",
          xml: "Name",
          xmlParents: ["Properties"],
          yaml: "Имя",
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { InternalInfo: {}, Properties: { Name: "Код" } },
      name: "Код",
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
      name: "Код",
    })

    expect(imported.yaml).toEqual({ Имя: "Код" })
    expect(exported.xml).toEqual({ InternalInfo: {}, Properties: { Name: "Код" } })
  })

  it("does not create an absent reference-only property in indexed round-trip", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Catalog.Товары.Attribute.Код",
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
    })
    const rule = {
      itemType: "TestDirectItem",
      properties: {
        internalInfo: {
          type: "InternalInfo",
          xml: "InternalInfo",
          forReferenceOnly: true,
          evaluateWhenYAMLMissing: true,
          items: [],
        },
        name: {
          type: "string",
          xml: "Name",
          yaml: "Имя",
        },
      },
    } as const satisfies MetadataItemRule
    const imported = testPropertyFromXMLToYAML({
      context: contexts.importContext,
      rule,
      xml: { Name: "Код" },
      name: "Код",
    })
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
      name: "Код",
    })

    expect(exported.xml).toEqual({ InternalInfo: {}, Name: "Код" })
  })


  it("использует XML-имена rules и не сохраняет aliases или present", () => {
    const { context, collector } = contextWithIndex()
    const rule = {
      itemType: "Catalog",
      properties: {
        synonym: { type: "string", yaml: "Синоним", xml: "CanonicalSynonym", xmlAliases: ["Synonym"] },
        name: { type: "string", yaml: "Имя", xml: "Name" },
      },
    } as const satisfies MetadataItemRule

    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: { Имя: "Товары", Синоним: "Номенклатура" },
      rule,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ CanonicalSynonym: "Номенклатура", Name: "Товары" })
    expect(JSON.stringify(collector.fragment("Справочник/Товары/Свойства.yaml").entities))
      .not.toMatch(/aliases|present/u)
  })

  it("восстанавливает служебную XML-идентичность без reference XML", () => {
    const { context, collector } = contextWithIndex()
    const rule = {
      itemType: "Catalog",
      properties: {
        uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true },
      },
    } as const satisfies MetadataItemRule

    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: {},
      rule,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ _uuid: TEST_CONFIGURATION_UUID })
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toContainEqual(
      expect.objectContaining({
        logicalAddress: "Справочник.Товары",
        uuid: TEST_CONFIGURATION_UUID,
      })
    )
  })
})
