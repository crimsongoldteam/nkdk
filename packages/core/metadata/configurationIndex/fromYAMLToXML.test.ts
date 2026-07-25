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
import { sampleIndex } from "./testData"

import "../commonObjects/metadataValue/toXML"
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
import "../systemEnumerations/toYAML"

function contextWithIndex(xmlValues = sampleIndex().xmlValues): {
  context: ConfigurationContextWithExportToXML
  collector: ReturnType<typeof createConfigurationIndexCollector>
} {
  const data = { ...sampleIndex(), xmlValues }
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
        configDumpInfo: new Map(),
        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    },
  }
}

describe("configuration index в едином YAML → XML-обходе", () => {
  it("восстанавливает явно заданное XML-значение, совпадающее с implicitValueYAML", () => {
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
    expect(exported.xml).toEqual({ Mode: "Auto" })
  })

  it("восстанавливает явно заданное логическое XML-значение из implicitValueYAML", () => {
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
    expect(exported.xml).toEqual({ Enabled: true })
  })

  it("восстанавливает XML-представление системного перечисления из implicitValueYAML", () => {
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
    expect(exported.xml).toEqual({ Type: "UsualButton" })
  })

  it("восстанавливает локализованное логическое implicitValueYAML", () => {
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
    expect(exported.xml).toEqual({ Enabled: false })
  })

  it("не экспортирует вычисленное значение по умолчанию отсутствующего XML-свойства", () => {
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
    expect(exported.xml).toEqual({ Name: "Тест" })
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

  it("восстанавливает из имени явно заданный Synonym, исключённый из YAML", () => {
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
        "v8:item": [
          {
            "v8:lang": "ru",
            "v8:content": "Регистр бухгалтерии по умолчанию",
          },
        ],
      },
    })
  })

  it("round-trips the complete XML property order without reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары",
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
    })
    const rule = {
      itemType: "TestDirectItem",
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
          exportWithoutReferenceXML: true,
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

  it("восстанавливает порядок свойств и XML aliases без reference XML", () => {
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

    expect(result.outputs.get("owner")).toEqual({ Name: "Товары", Synonym: "Номенклатура" })
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").xmlNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aliases: { synonym: "Synonym" },
          present: ["synonym"],
        }),
      ])
    )
  })

  it("восстанавливает XML-значения из индекса без reference XML", () => {
    const { context } = contextWithIndex([
      { logicalAddress: "Справочник.Товары.fillValue", xsiNil: true },
      {
        logicalAddress: "Справочник.Товары.userSettingsId",
        userSettingsId: "00000000-0000-4000-8000-000000000099",
      },
    ])
    const rule = {
      itemType: "Catalog",
      properties: {
        fillValue: { type: "MetadataValue", yaml: "ЗначениеЗаполнения", xml: "FillValue" },
        userSettingsId: { type: "UserSettingsID", yaml: "ИдентификаторНастройки", xml: "UserSettingsID" },
      },
    } as const satisfies MetadataItemRule

    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: { ИдентификаторНастройки: "Истина" },
      rule,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      FillValue: { "_xsi:nil": true },
      UserSettingsID: "00000000-0000-4000-8000-000000000099",
    })
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
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").identities).toContainEqual({
      logicalAddress: "Справочник.Товары",
      kind: "uuid",
      value: "00000000-0000-4000-8000-000000000001",
    })
  })
})
