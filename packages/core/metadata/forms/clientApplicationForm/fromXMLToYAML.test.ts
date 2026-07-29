import { describe, expect, it, vi } from "vitest"
import { createDirectRoundTripContexts } from "../../../tests/directConversion"
import { mockContextFromXML, mockXmlImportContext } from "../../../tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { xmlExport } from "../../../xml/export/exporter"
import { importContentFromXML } from "../../../xml/import/importer"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import type { ConfigurationSnapshotEntity } from "../../configurationIndex/types"
import { fullClientApplicationFormYAML, minimalClientApplicationFormYAML } from "./__fixtures__/data"
import { importClientApplicationFormFromXMLToYAML } from "./fromXMLToYAML"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import * as propertyImporter from "../../orchestration/property/fromXMLToYAML"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"

describe("importClientApplicationFormFromXMLToYAML", () => {
  it("обходит правила формы один раз для двух XML-источников", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "minimalMetadata.xml")
    const importSpy = vi.spyOn(propertyImporter, "importPropertiesFromXMLToYAML")

    importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })

    const rootCalls = importSpy.mock.calls.filter(([params]) => params.rule === ClientApplicationFormRules)
    expect(rootCalls).toHaveLength(1)
    expect(rootCalls[0]?.[0].sources).toHaveLength(2)
    importSpy.mockRestore()
  })

  it("совпадает с действующим YAML полной формы", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "fullMetadata.xml")

    const result = importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })

    expect(result.yaml).toEqual(fullClientApplicationFormYAML)
    expect(result.localIndexes.metadata.formDataPathIndex?.getRoot("Объект")).toMatchObject({
      kind: "formAttribute",
      name: "Объект",
    })
  })

  it("объединяет минимальные Form XML и metadata XML без модели", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "minimalMetadata.xml")

    const result = importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })

    expect(result.yaml).toEqual(minimalClientApplicationFormYAML)
    expect(result).not.toHaveProperty("model")
    expect(result).not.toHaveProperty("xml")
  })

  it("восстанавливает пустой контейнер реквизитов без reference XML", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "minimalMetadata.xml")
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.Минимальная",
    })

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "Минимальная",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "Минимальная",
    })

    expect(converted.formXML.Attributes).toEqual({})
  })

  it("собирает идентичности формы, вложенных элементов и singleton по каноническим адресам", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Контрагенты.Форма.ФормаЭлемента"
    const context = withConfigurationIndexCollector(mockContextFromXML(), collector, logicalAddress)
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "fullMetadata.xml")
    const inputField = (form.Form.ChildItems as Array<{ InputField: { ContextMenu: { _name: string } } }>)[0].InputField
    inputField.ContextMenu._name = "НестандартноеКонтекстноеМеню"

    importClientApplicationFormFromXMLToYAML({
      context,
      formName: "ФормаЭлемента",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })

    const identities = identityFacts(collector.fragment("Форма.yaml").entities)
    expect(identities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ logicalAddress, kind: "uuid" }),
        expect.objectContaining({ logicalAddress: `${logicalAddress}.Элемент.ПолеВвода1`, kind: "xmlId" }),
        expect.objectContaining({ logicalAddress: `${logicalAddress}.Атрибут.Объект`, kind: "xmlId" }),
        expect.objectContaining({ logicalAddress: `${logicalAddress}.Команда.Команда1`, kind: "xmlId" }),
        {
          logicalAddress: `${logicalAddress}.Элемент.ПолеВвода1.КонтекстноеМеню`,
          kind: "xmlId",
          value: "3",
        },
        {
          logicalAddress: `${logicalAddress}.Элемент.ПолеВвода1.КонтекстноеМеню`,
          kind: "xmlName",
          value: "НестандартноеКонтекстноеМеню",
        },
      ])
    )
    expect(identities).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ logicalAddress: `${logicalAddress}.Элемент.НестандартноеКонтекстноеМеню` }),
      ])
    )
  })

  it("собирает идентичности вложенной таблицы диаграммы Ганта", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Обработка.Планирование.Форма.Основная"
    const context = withConfigurationIndexCollector(mockContextFromXML(), collector, logicalAddress)

    importClientApplicationFormFromXMLToYAML({
      context,
      formName: "Основная",
      formXML: {
        ChildItems: [
          {
            GanttChartField: {
              _name: "ДиаграммаГанта",
              _id: "1",
              Table: {
                _name: "Table",
                _id: "98",
                ContextMenu: { _name: "TableКонтекстноеМеню", _id: "100" },
              },
              ContextMenu: { _name: "ДиаграммаГантаКонтекстноеМеню", _id: "2" },
            },
          },
        ],
      } as ClientApplicationFormXML,
      metadataXML: { Form: { Properties: { FormType: "Managed" } } },
    })

    expect(identityFacts(collector.fragment("Форма.yaml").entities)).toEqual(
      expect.arrayContaining([
        {
          logicalAddress: `${logicalAddress}.Элемент.ДиаграммаГанта.КонтекстноеМеню`,
          kind: "xmlId",
          value: "2",
        },
        {
          logicalAddress: `${logicalAddress}.Элемент.ДиаграммаГанта.Таблица`,
          kind: "xmlId",
          value: "98",
        },
        {
          logicalAddress: `${logicalAddress}.Элемент.ДиаграммаГанта.Таблица.КонтекстноеМеню`,
          kind: "xmlId",
          value: "100",
        },
      ])
    )
  })

  it("не сохраняет присутствие свойств Form.xml", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Контрагенты.Форма.ФормаЭлемента"
    const context = withConfigurationIndexCollector(mockContextFromXML(), collector, logicalAddress)

    importClientApplicationFormFromXMLToYAML({
      context,
      formName: "ФормаЭлемента",
      formXML: { Title: "Форма", Width: "80" },
      metadataXML: {
        Form: {
          _uuid: "00000000-0000-4000-8000-000000000001",
          Properties: { Name: "ФормаЭлемента", Comment: "Комментарий", FormType: "Managed" },
        },
      },
    })

    expect(JSON.stringify(collector.fragment("Форма.yaml").entities)).not.toContain("present")
  })

  it("добавляет Контроль metadata формы и сохраняет Extended Form только в снимке", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Контрагенты.Форма.ФормаЭлемента"
    const baseContext = mockXmlImportContext()
    const extensionContext = {
      ...baseContext,
      fromXML: { ...baseContext.fromXML, metadataItemAugmenter: "configurationExtension" },
    }
    const context = withConfigurationIndexCollector(
      extensionContext,
      collector,
      logicalAddress
    )
    const metadataXML: FormMetadataXML & {
      Form: { InternalInfo: Record<string, unknown> }
    } = {
      Form: {
        Properties: {
          Name: "ФормаЭлемента",
          Comment: "Комментарий",
          FormType: "Managed",
        },
        InternalInfo: {
          "xr:PropertyState": [
            { "xr:Property": "ExtendedPresentation", "xr:State": "Notify" },
            { "xr:Property": "Form", "xr:State": "Extended" },
            { "xr:Property": "Form", "xr:State": "Notify" },
          ],
        },
      },
    }

    const result = importClientApplicationFormFromXMLToYAML({
      context,
      formName: "ФормаЭлемента",
      formXML: {},
      metadataXML,
    })

    expect(result.yaml).toMatchObject({
      Комментарий: "Комментарий",
      Контроль: ["РасширенноеПредставление"],
    })
    expect(result.yaml).not.toHaveProperty("Контроль", expect.arrayContaining(["Форма"]))
    expect(collector.fragment("Форма.yaml").entities).toContainEqual(
      expect.objectContaining({
        logicalAddress: `${logicalAddress}.form`,
        xml: { extended: true },
      })
    )
  })
})

function identityFacts(entities: readonly ConfigurationSnapshotEntity[]) {
  return entities.flatMap((entity) =>
    Object.entries(entity.identities ?? {}).map(([kind, value]) => ({
      logicalAddress: entity.logicalAddress,
      kind,
      value,
    }))
  )
}

describe("форма XML → YAML → XML", () => {
  it("сохраняет режимные события элемента формы", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const formXML = {
      ChildItems: [
        {
          InputField: {
            _name: "ПолеВвода",
            _id: "1",
            Events: {
              Event: [
                { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
                { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
                { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
              ],
            },
          },
        },
      ],
    } as ClientApplicationFormXML
    const metadataXML = { Form: { Properties: { FormType: "Managed" } } } as FormMetadataXML

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаЭлемента",
      formXML,
      metadataXML,
    })

    expect(imported.yaml).toMatchObject({
      Элементы: {
        ПолеВвода: {
          События: {
            ПриИзменении: {
              Перед: "ПередИзменением",
              После: "ПослеИзменения",
            },
            НачалоВыбора: {
              Вместо: "ВместоВыбора",
            },
          },
        },
      },
    })

    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })
    const inputField = (converted.formXML.ChildItems as Array<{ InputField: { Events?: unknown } }>)[0]?.InputField

    expect(inputField?.Events).toEqual({
      Event: [
        { _name: "OnChange", _callType: "Before", "#text": "ПередИзменением" },
        { _name: "OnChange", _callType: "After", "#text": "ПослеИзменения" },
        { _name: "StartChoice", _callType: "Override", "#text": "ВместоВыбора" },
      ],
    })
  })

  it("формирует канонический порядок событий формы без reference XML", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const formXML = {
      Events: {
        Event: [
          { _name: "OnOpen", "#text": "ПриОткрытии" },
          { _name: "BeforeClose", "#text": "ПередЗакрытием" },
          { _name: "ActivationProcessing", "#text": "ОбработкаАктивизации" },
        ],
      },
    } as ClientApplicationFormXML
    const metadataXML = { Form: { Properties: { FormType: "Managed" } } } as FormMetadataXML

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаЭлемента",
      formXML,
      metadataXML,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })
    const events = converted.formXML.Events?.Event

    expect(Array.isArray(events) ? events.map((event) => event._name) : []).toEqual([
      "ActivationProcessing",
      "BeforeClose",
      "OnOpen",
    ])
  })

  it("сохраняет нестандартное XML-имя события как identity без aliases", () => {
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "БизнесПроцесс.Заказ.Форма.ФормаЗадачи",
    })
    const formXML = {
      Events: {
        Event: [
          { _name: "81c01005-9b73-4278-853b-1a8d203c8e8c", "#text": "ОбработкаАктивации" },
          { _name: "ea0a9886-1607-44fe-a446-2cc57548f57d", "#text": "ПередВыполнением" },
        ],
      },
    } as ClientApplicationFormXML
    const metadataXML = { Form: { Properties: { FormType: "Managed" } } } as FormMetadataXML

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаЗадачи",
      formXML,
      metadataXML,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаЗадачи",
    })
    const importedForm = imported.yaml as ClientApplicationFormYAML
    const events = converted.formXML.Events?.Event

    expect(importedForm).toMatchObject({
      События: {
        ПередВыполнением: "ПередВыполнением",
      },
    })
    expect(importedForm.События).not.toHaveProperty("ОбработкаАктивации")
    expect(Array.isArray(events) ? events.map((event) => event._name) : []).toEqual([
      "BeforeExecute",
      "81c01005-9b73-4278-853b-1a8d203c8e8c",
    ])
  })

  it("восстанавливает идентификаторы элементов формы без reference XML", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "fullMetadata.xml")
    const sourceAttributes = form.Form.Attributes?.Attribute
    const sourceAttribute = (Array.isArray(sourceAttributes) ? sourceAttributes[0] : sourceAttributes) as {
      _id: string
    }
    const sourceInputField = (
      form.Form.ChildItems as Array<{
        InputField: {
          _id: string
          ContextMenu: { _id: string }
          ExtendedTooltip: { _id: string }
        }
      }>
    )[0]!.InputField
    const sourceCommands = form.Form.Commands?.Command
    const sourceCommand = (Array.isArray(sourceCommands) ? sourceCommands[0] : sourceCommands) as { _id: string }
    sourceAttribute._id = "11"
    sourceInputField._id = "22"
    sourceInputField.ContextMenu._id = "33"
    sourceInputField.ExtendedTooltip._id = "44"
    sourceCommand._id = "55"
    const autoCommandBar = form.Form.AutoCommandBar as { _name?: string } | undefined
    if (autoCommandBar !== undefined) autoCommandBar._name = ""
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаЭлемента",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаЭлемента",
    })
    const inputField = (converted.formXML.ChildItems as Array<{ InputField: ClientApplicationFormXML }>)[0].InputField

    expect(converted.formXML.Attributes?.Attribute).toEqual(
      expect.arrayContaining([expect.objectContaining({ _name: "Объект", _id: "11" })])
    )
    expect(inputField).toEqual(
      expect.objectContaining({
        _name: "ПолеВвода1",
        _id: "22",
        ContextMenu: expect.objectContaining({ _name: "ПолеВвода1КонтекстноеМеню", _id: "33" }),
        ExtendedTooltip: expect.objectContaining({ _name: "ПолеВвода1РасширеннаяПодсказка", _id: "44" }),
      })
    )
    expect(converted.formXML.Commands?.Command).toEqual(
      expect.arrayContaining([expect.objectContaining({ _name: "Команда1", _id: "55" })])
    )
    expect(converted.formXML.AutoCommandBar).toEqual(expect.objectContaining({ _name: "", _id: "-1" }))
  })

  it("восстанавливает имена подсказок вложенных дополнений таблицы без reference XML", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "reportForm.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "reportFormMetadata.xml"
    )
    const contexts = createDirectRoundTripContexts({
      logicalAddress: "Отчет.ОтчетВсеСвойства.Форма.ФормаОтчета",
    })
    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаОтчета",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаОтчета",
    })
    const table = (
      converted.formXML.ChildItems as Array<{
        Table?: {
          SearchStringAddition?: { ExtendedTooltip?: { _name?: string } }
          ViewStatusAddition?: { ExtendedTooltip?: { _name?: string } }
          SearchControlAddition?: { ExtendedTooltip?: { _name?: string } }
        }
      }>
    ).find((item) => item.Table !== undefined)?.Table

    expect(table?.SearchStringAddition?.ExtendedTooltip?._name).toBe(
      "ТабличнаяЧастьВсеСвойстваСтрокаПоискаРасширеннаяПодсказка"
    )
    expect(table?.ViewStatusAddition?.ExtendedTooltip?._name).toBe(
      "ТабличнаяЧастьВсеСвойстваСостояниеПросмотраРасширеннаяПодсказка"
    )
    expect(table?.SearchControlAddition?.ExtendedTooltip?._name).toBe(
      "ТабличнаяЧастьВсеСвойстваУправлениеПоискомРасширеннаяПодсказка"
    )
  })

  it("восстанавливает порядок metadata-свойств по адресу metadata-файла", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, "fullMetadata.xml")
    const sourceProperties = metadata.MetaDataObject.Form.Properties
    metadata.MetaDataObject.Form.Properties = {
      Name: sourceProperties.Name,
      Synonym: sourceProperties.Synonym,
      Comment: sourceProperties.Comment,
      FormType: sourceProperties.FormType,
      IncludeHelpInContents: sourceProperties.IncludeHelpInContents,
      UsePurposes: sourceProperties.UsePurposes,
    }
    const logicalAddress = "Справочник.Товары.Форма.ФормаСписка"
    const contexts = createDirectRoundTripContexts({ logicalAddress })

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName: "ФормаСписка",
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: "ФормаСписка",
    })

    expect(Object.keys(converted.metadataXML.Form.Properties)).toEqual([
      "Name",
      "Synonym",
      "Comment",
      "FormType",
      "IncludeHelpInContents",
      "UsePurposes",
    ])
  })

  const cases = [
    ["полная", "full.xml", "fullMetadata.xml"],
    ["минимальная", "minimal.xml", "minimalMetadata.xml"],
    ["каталога", "catalogFull.xml", "minimalMetadata.xml"],
    ["документа", "documentFull.xml", "minimalMetadata.xml"],
    ["без реквизитов условного оформления", "conditionalAppearanceWithoutAttributes.xml", "minimalMetadata.xml"],
    ["с шириной дочерних элементов", "childItemsWidth.xml", "minimalMetadata.xml"],
    ["с папкой пользовательских настроек", "customSettingsFolder.xml", "customSettingsFolderMetadata.xml"],
    ["отчёта", "reportForm.xml", "reportFormMetadata.xml"],
    ["с динамическим списком", "withDynamicList.xml", "minimalMetadata.xml"],
  ] as const

  it.each(cases)("сохраняет форму %s", (_title, formFixture, metadataFixture) => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, formFixture)
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(import.meta.url, metadataFixture)
    const logicalAddress = "Справочник.Товары.Форма.ФормаЭлемента"
    const contexts = createDirectRoundTripContexts({ logicalAddress })
    const formName = String(metadata.MetaDataObject.Form.Properties.Name)

    const imported = importClientApplicationFormFromXMLToYAML({
      context: contexts.importContext,
      formName,
      formXML: form.Form,
      metadataXML: metadata.MetaDataObject,
    })
    const converted = convertClientApplicationFormFromYAMLToXML({
      context: contexts.exportContext(),
      yaml: imported.yaml as ClientApplicationFormYAML,
      name: formName,
      referenceFormXML: form.Form,
      referenceMetadataXML: metadata.MetaDataObject,
    })

    expect(canonicalSnapshot13XML(xmlExport({ Form: converted.formXML }))).toEqual(
      canonicalSnapshot13XML(readXMLFixtureAsString(import.meta.url, formFixture))
    )
    expect(canonicalXML(xmlExport({ MetaDataObject: converted.metadataXML }))).toEqual(
      canonicalXML(readXMLFixtureAsString(import.meta.url, metadataFixture))
    )
  })
})

function canonicalXML(xml: string): unknown {
  return withoutFormattingText(importContentFromXML(xml))
}

const SNAPSHOT_13_XML_NAMES: Readonly<Record<string, string>> = {
  ChildItemsHorizontalAlign: "HorizontalAlign",
  ChildItemsVerticalAlign: "VerticalAlign",
  SlaveItemsWidth: "ChildItemsWidth",
  ItemsAndTitlesAlign: "ChildrenAlign",
  CollapseItemsByImportance: "CollapseItemsByImportanceVariant",
}

function canonicalSnapshot13XML(xml: string): unknown {
  return normalizeSnapshot13XML(canonicalXML(xml))
}

function normalizeSnapshot13XML(value: unknown): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map(normalizeSnapshot13XML)
    if (normalized.every((item) => isEventXML(item))) {
      normalized.sort((left, right) =>
        eventXMLKey(left).localeCompare(eventXMLKey(right))
      )
    }
    return normalized
  }
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      SNAPSHOT_13_XML_NAMES[key] ?? key,
      normalizeSnapshot13XML(child),
    ])
  )
}

function isEventXML(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && typeof (value as Record<string, unknown>)["_name"] === "string"
}

function eventXMLKey(value: Record<string, unknown>): string {
  return [value["_name"], value["_callType"], value["#text"]].join("\u0000")
}

function withoutFormattingText(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutFormattingText)
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, child]) => key !== "#text" || typeof child !== "string" || child.trim().length > 0)
      .map(([key, child]) => [key, withoutFormattingText(child)])
  )
}
