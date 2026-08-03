import { describe, expect, it } from "vitest"
import {
  createDirectRoundTripContexts,
  testPropertyFromXMLToYAML,
  testPropertyFromYAMLToXML,
} from "../../tests/directConversion"
import type { ConfigurationContextWithExportToXML } from "../context/types"
import { convertPropertiesFromYAMLToXML } from "../orchestration/property/fromYAMLToXML"
import type { TypeRulesOperations } from "../orchestration/property/fn"
import type { MetadataItemRule } from "../orchestration/property/types"
import { createConfigurationIndexCollector } from "./collector/writer"
import { encodeConfigurationIndex } from "./encode"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "./sharedSnapshot"
import { sampleSnapshot, TEST_UUID } from "./testData"
import type { ConfigurationSnapshotEntity } from "./types"

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

function contextWithIndex(extraEntities: readonly ConfigurationSnapshotEntity[] = []): {
  context: ConfigurationContextWithExportToXML
  collector: ReturnType<typeof createConfigurationIndexCollector>
} {
  const snapshot = sampleSnapshot()
  const data = {
    ...snapshot,
    entities: [
      ...snapshot.entities,
      {
        logicalAddress: "Справочник.Товары",
        sourceProjectPath: "Configuration.yaml",
        identities: { uuid: TEST_UUID },
      },
      ...extraEntities,
    ],
  }
  const source = createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(data)))
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

describe("configuration index в едином YAML → XML-обходе", () => {
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

  it("не восстанавливает XML-значение, исключённое из YAML как implicitValueYAML", () => {
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
      },
    })
    expect(exported.xml).toEqual(source)
  })

  it("не восстанавливает логическое XML-значение, исключённое из YAML как implicitValueYAML", () => {
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

  it("не восстанавливает системное перечисление, исключённое из YAML как implicitValueYAML", () => {
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

  it("не восстанавливает локализованное логическое implicitValueYAML", () => {
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
    const exported = testPropertyFromYAMLToXML({
      context: contexts.exportContext(),
      rule,
      yaml: imported.yaml,
      name: "Товары",
    })

    expect(imported.yaml).toEqual({ Имя: "Товары", Ресурсы: "Ресурс1" })
    expect(Object.keys(exported.xml)).toEqual(["InternalInfo", "Properties", "ChildObjects"])
    expect(Object.keys(exported.xml.Properties as object)).toEqual(["Name"])
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

  it("восстанавливает XML-значения из снимка без reference XML", () => {
    const { context } = contextWithIndex([
      {
        logicalAddress: "Справочник.Товары.fillValue",
        sourceProjectPath: "Configuration.yaml",
        xml: { xsiNil: true },
      },
    ])
    const rule = {
      itemType: "Catalog",
      properties: {
        fillValue: { type: "MetadataValue", yaml: "ЗначениеЗаполнения", xml: "FillValue" },
      },
    } as const satisfies MetadataItemRule

    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: {},
      rule,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      FillValue: { "_xsi:nil": true },
    })
  })

  it("восстанавливает потерянный xsi:type пустого MetadataValue без reference XML", () => {
    const rule = {
      itemType: "Catalog",
      properties: {
        fillValue: { type: "MetadataValue", yaml: "ЗначениеЗаполнения", xml: "FillValue" },
      },
    } as const satisfies MetadataItemRule
    const roundTrip = createDirectRoundTripContexts()
    const imported = testPropertyFromXMLToYAML({
      context: roundTrip.importContext,
      rule,
      xml: { FillValue: { "_xsi:type": "v8:Null" } },
    })
    const restored = testPropertyFromYAMLToXML({
      context: roundTrip.exportContext(),
      rule,
      yaml: imported.yaml,
    })

    expect(restored.xml).toEqual({ FillValue: { "_xsi:type": "v8:Null" } })
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

    expect(result.outputs.get("owner")).toEqual({ _uuid: "00000000-0000-4000-8000-000000000001" })
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").entities).toContainEqual(
      expect.objectContaining({
        logicalAddress: "Справочник.Товары",
        identities: { uuid: TEST_UUID },
      })
    )
  })
})
