import { describe, expect, it } from "vitest"
import { importContentFromXML } from "@nkdk/runtime"
import {
  createDirectRoundTripContexts,
  testMetadataItemFromXMLToYAML,
  testMetadataItemFromYAMLToXML,
} from "../../../tests/directConversion"
import { CLEAN_CONFIGURATION_XML, EXPECTED_CLEAN_CONFIGURATION_YAML } from "./cleanConfiguration.fixture"
import "./requiredMobileApplicationPermissions"
import "./usedMobileApplicationFunctionalities"
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

const exportConfiguration = (yaml: unknown, referenceXML?: ReturnType<typeof cleanFixture>) => {
  const exported = testMetadataItemFromYAMLToXML({
    rule: MetadataConfigurationRules,
    yaml,
    name: "Конфигурация",
    referenceXML,
  })
  const properties = (exported.xml.MetaDataObject as { Configuration: { Properties: Record<string, unknown> } })
    .Configuration.Properties
  return { metadataObject: exported.xml.MetaDataObject, properties }
}

const roundTripConfigurationFromYAML = (yaml: Record<string, unknown>) => {
  const { metadataObject, properties } = exportConfiguration(yaml)
  const imported = testMetadataItemFromXMLToYAML({
    rule: MetadataConfigurationRules,
    xml: metadataObject,
    name: "Конфигурация",
  })

  return { imported, properties }
}

const permissionMessage = (permission: string, content: string) => ({
  "app:permission": permission,
  "app:description": {
    "v8:item": [{ "v8:lang": "ru", "v8:content": content }],
  },
})

const sourcePermissionMessages = [
  permissionMessage("Biometrics", "Это позволит производить авторизацию в приложении с помощью биометрии."),
  permissionMessage("Camera", "Это позволит производить съемку фото или видео."),
  permissionMessage("Microphone", "Это позволит производить запись аудиофайлов."),
  permissionMessage(
    "MusicLibrary",
    "Это позволит во вложениях использовать аудиофайлы (в задачах, обсуждениях, письмах и др.)."
  ),
  permissionMessage(
    "PictureAndVideoLibraries",
    "Это позволит во вложениях использовать изображения и видео (в задачах, обсуждениях, письмах и др.)."
  ),
  permissionMessage("AudioPlaybackAndVibration", "Это позволит воспроизводить аудиофайлы и вибрацию."),
  permissionMessage("PostNotifications", "Это позволит отображать уведомления на главном экране."),
]

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
      Синоним: "",
      ОсновнойЯзык: "Русский",
    })
    expect(EXPECTED_CLEAN_CONFIGURATION_YAML).toContain("Имя: Конфигурация")

    const { properties } = exportConfiguration(imported.yaml, referenceXML)
    const functionalities = properties.UsedMobileApplicationFunctionalities as {
      "app:functionality": Array<{ "app:functionality": string; "app:use": boolean | string }>
    }

    expect(properties.CompatibilityMode).toBe("Version8_3_27")
    expect(functionalities["app:functionality"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "app:functionality": "Biometrics", "app:use": true }),
        expect.objectContaining({ "app:functionality": "OSBackup", "app:use": true }),
      ])
    )
  })

  it("восстанавливает скрытые стандартные значения без reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Конфигурация",
      targetProjectPath: "Конфигурация.yaml",
    })
    const imported = testMetadataItemFromXMLToYAML({
      context: contexts.importContext,
      rule: MetadataConfigurationRules,
      xml: cleanFixture().MetaDataObject,
      name: "Конфигурация",
    })

    const exported = testMetadataItemFromYAMLToXML({
      context: contexts.exportContext(),
      rule: MetadataConfigurationRules,
      yaml: imported.yaml,
      name: "Конфигурация",
    })
    const properties = (exported.xml.MetaDataObject as { Configuration: { Properties: Record<string, unknown> } })
      .Configuration.Properties

    expect(properties.UsePurposes).toEqual({
      "v8:Value": {
        "_xsi:type": "app:ApplicationUsePurpose",
        "#text": "PlatformApplication",
      },
    })
    expect(
      (
        properties.UsedMobileApplicationFunctionalities as {
          "app:functionality": unknown[]
        }
      )["app:functionality"]
    ).toHaveLength(38)
  })

  it("преобразует требуемые разрешения мобильного приложения", () => {
    const yaml = {
      Имя: "Конфигурация",
      ОсновнойЯзык: "Русский",
      ТребуемыеРазрешенияМобильногоПриложения: [
        { Разрешение: "Камера", Использовать: "Истина", Описание: "Первое" },
        { Разрешение: "PostNotifications", Использовать: "Ложь", Описание: "" },
        { Разрешение: "Камера", Использовать: "Ложь", Описание: { ru: "Повтор", en: "Duplicate" } },
      ],
    }
    const { imported, properties } = roundTripConfigurationFromYAML(yaml)

    expect(properties.RequiredMobileApplicationPermissions).toEqual({
      "app:permission": [
        {
          "app:permission": "Camera",
          "app:use": true,
          "app:description": {
            "v8:item": [{ "v8:lang": "ru", "v8:content": "Первое" }],
          },
        },
        {
          "app:permission": "PostNotifications",
          "app:use": false,
          "app:description": {},
        },
        {
          "app:permission": "Camera",
          "app:use": false,
          "app:description": {
            "v8:item": [
              { "v8:lang": "ru", "v8:content": "Повтор" },
              { "v8:lang": "en", "v8:content": "Duplicate" },
            ],
          },
        },
      ],
    })
    expect(imported.yaml).toMatchObject(yaml)
  })

  it("сохраняет семь реальных сообщений разрешений и XML-порядок контейнера", () => {
    const referenceXML = cleanFixture()
    const usedFunctionalities = referenceXML.MetaDataObject.Configuration.Properties
      .UsedMobileApplicationFunctionalities as Record<string, unknown>
    usedFunctionalities["app:permissionMessage"] = sourcePermissionMessages

    const imported = testMetadataItemFromXMLToYAML({
      rule: MetadataConfigurationRules,
      xml: referenceXML.MetaDataObject,
      name: "Конфигурация",
    })
    expect(imported.yaml).toMatchObject({
      ИспользуемаяФункциональностьМобильногоПриложения: {
        СообщенияРазрешений: [
          { Разрешение: "Биометрия", Описание: "Это позволит производить авторизацию в приложении с помощью биометрии." },
          { Разрешение: "Камера", Описание: "Это позволит производить съемку фото или видео." },
          { Разрешение: "Микрофон", Описание: "Это позволит производить запись аудиофайлов." },
          {
            Разрешение: "БиблиотекаМузыки",
            Описание: "Это позволит во вложениях использовать аудиофайлы (в задачах, обсуждениях, письмах и др.).",
          },
          {
            Разрешение: "БиблиотекиКартинокИВидео",
            Описание:
              "Это позволит во вложениях использовать изображения и видео (в задачах, обсуждениях, письмах и др.).",
          },
          {
            Разрешение: "ВоспроизведениеАудиоИВибрация",
            Описание: "Это позволит воспроизводить аудиофайлы и вибрацию.",
          },
          { Разрешение: "PostNotifications", Описание: "Это позволит отображать уведомления на главном экране." },
        ],
      },
    })

    const { properties } = exportConfiguration(imported.yaml, referenceXML)
    const exportedUsedFunctionalities = properties.UsedMobileApplicationFunctionalities as Record<string, unknown>

    expect(Object.keys(exportedUsedFunctionalities)).toEqual(["app:functionality", "app:permissionMessage"])
    expect(exportedUsedFunctionalities["app:permissionMessage"]).toEqual(sourcePermissionMessages)
  })

  it("удаляет отсутствующие мобильные разрешения из reference XML", () => {
    const referenceXML = cleanFixture()
    const properties = referenceXML.MetaDataObject.Configuration.Properties
    properties.RequiredMobileApplicationPermissions = {
      "app:permission": {
        "app:permission": "Camera",
        "app:use": true,
        "app:description": { "v8:item": [{ "v8:lang": "ru", "v8:content": "Камера" }] },
      },
    }
    const usedFunctionalities = properties.UsedMobileApplicationFunctionalities as Record<string, unknown>
    usedFunctionalities["app:permissionMessage"] = [sourcePermissionMessages[0]]

    const { properties: exportedProperties } = exportConfiguration(
      { Имя: "Конфигурация", ОсновнойЯзык: "Русский" },
      referenceXML
    )

    expect(exportedProperties.RequiredMobileApplicationPermissions).toBe("")
    expect(exportedProperties.UsedMobileApplicationFunctionalities).not.toHaveProperty("app:permissionMessage")
    expect(
      (
        exportedProperties.UsedMobileApplicationFunctionalities as {
          "app:functionality": unknown[]
        }
      )["app:functionality"]
    ).toHaveLength(38)
  })

  it("преобразует различия мобильной функциональности с русскими boolean-значениями", () => {
    const yaml = {
      Имя: "Конфигурация",
      ОсновнойЯзык: "Русский",
      ИспользуемаяФункциональностьМобильногоПриложения: {
        Функциональности: [
          { Функциональность: "РезервноеКопированиеСредствамиОС", Использовать: "Ложь" },
        ],
      },
    }
    const { imported, properties } = roundTripConfigurationFromYAML(yaml)

    expect(properties.UsedMobileApplicationFunctionalities).toBeDefined()
    expect(imported.yaml).toMatchObject({
      ИспользуемаяФункциональностьМобильногоПриложения: {
        Функциональности: [
          { Функциональность: "РезервноеКопированиеСредствамиОС", Использовать: "Ложь" },
        ],
      },
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
    const { imported } = roundTripConfigurationFromYAML(yaml)

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
