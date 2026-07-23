import { describe, expect, it } from "vitest"
import { importContentFromXML } from "../../../xml/import/importer"
import { testMetadataItemFromXMLToYAML, testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { CLEAN_CONFIGURATION_XML, EXPECTED_CLEAN_CONFIGURATION_YAML } from "./cleanConfiguration.fixture"
import { MetadataConfigurationRules } from "./rules"

const cleanFixture = () =>
  importContentFromXML<{
    MetaDataObject: {
      Configuration: {
        Properties: Record<string, unknown>
        ChildObjects: Record<string, unknown>
      }
    }
  }>(CLEAN_CONFIGURATION_XML)

describe("Configuration: единые XML → YAML и YAML → XML обходы", () => {
  it("преобразует clean Configuration без скрытых значений и восстанавливает XML defaults", () => {
    const referenceXML = cleanFixture()
    const imported = testMetadataItemFromXMLToYAML({
      rule: MetadataConfigurationRules,
      xml: referenceXML.MetaDataObject,
      name: "Конфигурация",
    })

    expect(imported.yaml).toEqual({
      Имя: "Конфигурация",
      ОсновнойЯзык: "Русский",
    })
    expect(EXPECTED_CLEAN_CONFIGURATION_YAML).toContain("Имя: Конфигурация")

    const exported = testMetadataItemFromYAMLToXML({
      rule: MetadataConfigurationRules,
      yaml: imported.yaml,
      name: "Конфигурация",
      referenceXML,
    })
    const properties = (exported.xml.MetaDataObject as { Configuration: { Properties: Record<string, unknown> } })
      .Configuration.Properties
    const functionalities = properties.UsedMobileApplicationFunctionalities as {
      "app:functionality": Array<{ "app:functionality": string; "app:use": boolean | string }>
    }

    expect(properties.CompatibilityMode).toBe("Version8_3_27")
    expect(functionalities["app:functionality"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "app:functionality": "Biometrics", "app:use": "true" }),
        expect.objectContaining({ "app:functionality": "OSBackup", "app:use": "true" }),
      ])
    )
  })

  it("преобразует различия мобильной функциональности с русскими boolean-значениями", () => {
    const yaml = {
      Имя: "Конфигурация",
      ОсновнойЯзык: "Русский",
      ИспользуемаяФункциональностьМобильногоПриложения: [
        { Функциональность: "РезервноеКопированиеСредствамиОС", Использовать: "Ложь" },
      ],
    }
    const exported = testMetadataItemFromYAMLToXML({
      rule: MetadataConfigurationRules,
      yaml,
      name: "Конфигурация",
    })
    const properties = (exported.xml.MetaDataObject as { Configuration: { Properties: Record<string, unknown> } })
      .Configuration.Properties
    const imported = testMetadataItemFromXMLToYAML({
      rule: MetadataConfigurationRules,
      xml: exported.xml.MetaDataObject,
      name: "Конфигурация",
    })

    expect(properties.UsedMobileApplicationFunctionalities).toBeDefined()
    expect(imported.yaml).toMatchObject({
      ИспользуемаяФункциональностьМобильногоПриложения: [
        { Функциональность: "РезервноеКопированиеСредствамиОС", Использовать: "Ложь" },
      ],
    })
  })

  it("преобразует мобильные ссылки и входящие запросы Поделиться одним обходом Configuration", () => {
    const yaml = {
      Имя: "Конфигурация",
      НавигационныеСсылкиМобильногоПриложения: [
        {
          baseUrl: "НавигационнаяСсылкаМобильногоПриложения",
          useAndroid: "Истина",
          useIOS: "Ложь",
          useWindows: "Ложь",
        },
      ],
      ДопустимыеТипыВходящихЗапросовПоделиться: [
        {
          mime: "text/plain",
          uti: "public.plain-text",
          ext: "txt",
          processingVariant: 0,
          isCustom: "Истина",
        },
      ],
    }
    const exported = testMetadataItemFromYAMLToXML({
      rule: MetadataConfigurationRules,
      yaml,
      name: "Конфигурация",
    })
    const imported = testMetadataItemFromXMLToYAML({
      rule: MetadataConfigurationRules,
      xml: exported.xml.MetaDataObject,
      name: "Конфигурация",
    })

    expect(imported.yaml).toMatchObject(yaml)
  })

  it("сохраняет неизвестные корневые XML-узлы из reference", () => {
    const referenceXML = cleanFixture()
    referenceXML.MetaDataObject.Configuration.Properties.UnknownProperty = { "#text": "Значение" }

    const exported = testMetadataItemFromYAMLToXML({
      rule: MetadataConfigurationRules,
      yaml: { Имя: "Конфигурация", ОсновнойЯзык: "Русский" },
      name: "Конфигурация",
      referenceXML,
    })

    expect(
      (exported.xml.MetaDataObject as { Configuration: { Properties: Record<string, unknown> } }).Configuration
        .Properties.UnknownProperty
    ).toEqual({ "#text": "Значение" })
  })
})
