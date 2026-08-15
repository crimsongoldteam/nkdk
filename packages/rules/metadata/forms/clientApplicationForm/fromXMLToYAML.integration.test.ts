import { describe, expect, it, vi } from "vitest"
import { createDirectRoundTripContexts } from "../../../tests/directConversion"
import { mockContextFromXML, mockXmlImportContext } from "../../../tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "../../../tests/readFixtureXML"
import { xmlExport } from "@nkdk/runtime"
import { importContentFromXML } from "@nkdk/runtime"
import { withConfigurationIndexCollector } from "@nkdk/runtime"
import { createConfigurationIndexCollector } from "@nkdk/runtime"
import type { ConfigurationIndexBlockEntity } from "@nkdk/runtime"
import { fullClientApplicationFormYAML, minimalClientApplicationFormYAML } from "./__fixtures__/data"
import {
  importClientApplicationFormBodyFromXML,
  importClientApplicationFormFromXMLToYAML,
} from "./fromXMLToYAML"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import * as propertyImporter from "../../ruleRuntime/property/fromXMLToYAML"
import {
  ClientApplicationFormRules,
  ClientApplicationFormWithExtendedPresentationRules,
} from "./rules"
import type { ClientApplicationFormXML, ClientApplicationFormYAML, FormMetadataXML } from "./types"
import { bindDeferredObjectValues } from "@nkdk/runtime/rule-kit"
import { finalizeImportedYamlValues } from "../../ruleRuntime/property/finalizeImportedYAML"
import type { FormAttributeColumnsXML } from "../commonObjects/formAttribute/types"
import { createLocalIndexesCollector } from "../../projectDefinition/localIndexes"
import { createDeferredValuePathCollector } from "@nkdk/runtime/rule-kit"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../composition/metadataExecutionContext"
import { metadataRules } from "../../composition/metadataRules"
import {
  markYAMLScalarTag,
  XML_PRESENT_TAG_VALUE,
  xmlAnomalyTagValue,
  yamlMappingKeyTagAt,
  yamlScalarTagAt,
} from "@nkdk/runtime"

const emptyOwnerMetadataCache = {
  listRefs: () => [],
  get: () => ({ status: "not-found" as const, diagnostics: [] }),
}

function currentDataImportContext() {
  return {
    ...mockContextFromXML(),
    exportToYAML: { toTyped: false, ownerMetadataCache: emptyOwnerMetadataCache },
  }
}

function finalizeImportedFormDataPaths(result: ReturnType<typeof importClientApplicationFormFromXMLToYAML>): void {
  finalizeImportedYamlValues({
    yaml: result.yaml,
    rootRule: ClientApplicationFormRules,
    deferred: bindDeferredObjectValues(result.yaml, result.deferred),
    context: currentDataImportContext(),
    formDataPathIndex: result.localIndexes.metadata.formDataPathIndex,
  })
}

function importValueTableCurrentDataForm(columns: FormAttributeColumnsXML, columnName: string) {
  return importClientApplicationFormFromXMLToYAML({
    context: currentDataImportContext(),
    formName: "Форма",
    formXML: {
      Attributes: {
        Attribute: [{
          _name: "Строки",
          _id: "1",
          Type: { "v8:Type": "v8:ValueTable" },
          Columns: columns,
        }],
      },
      ChildItems: [
        { Table: { _name: "Строки", _id: "1", DataPath: "Строки" } },
        {
          InputField: {
            _name: "Поле",
            _id: "2",
            DataPath: `Items.Строки.CurrentData.${columnName}`,
          },
        },
      ],
    },
    metadataXML: { Form: { Properties: { FormType: "Managed" } } },
  })
}

describe("importClientApplicationFormFromXMLToYAML", () => {
  it("сохраняет тип обычной формы без Form.xml", () => {
    const result = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "ОбычнаяФорма",
      formXML: undefined,
      metadataXML: { Form: { Properties: { FormType: "Ordinary" } } },
    })

    expect(result.yaml).toEqual({ ТипФормы: "Обычная" })
  })

  it("не выводит тип управляемой формы", () => {
    const result = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "УправляемаяФорма",
      formXML: {},
      metadataXML: { Form: { Properties: { FormType: "Managed" } } },
    })

    expect(result.yaml).not.toHaveProperty("ТипФормы")
  })

  it("импортирует только тело формы через отдельные накопители", () => {
    const collector = createLocalIndexesCollector()
    const deferred = createDeferredValuePathCollector()
    const result = importClientApplicationFormBodyFromXML({
      context: mockContextFromXML(),
      formName: "Форма",
      formXML: { Width: 12, Properties: { Comment: "Не часть тела" } },
      rule: ClientApplicationFormRules,
      collector,
      deferred,
    })

    expect(result.yaml).toMatchObject({ Ширина: 12 })
    expect(result.yaml).not.toHaveProperty("Комментарий")
    expect(collector.finish().metadata.events.length).toBeGreaterThan(0)
    expect(deferred.finish()).toEqual([])
  })

  it("индексирует произвольные реквизиты и колонки при прямом импорте", () => {
    const result = importClientApplicationFormFromXMLToYAML({
      context: { ...mockContextFromXML(), exportToYAML: { toTyped: true } },
      formName: "Форма",
      formXML: {
        Attributes: {
          Attribute: [
            { _name: "ПроизвольныйРеквизит", _id: "1", Type: {} },
            {
              _name: "Таблица",
              _id: "2",
              Type: { "v8:Type": "v8:ValueTable" },
              Columns: { Column: { _name: "Значение", _id: "1", Type: {} } },
            },
          ],
        },
      },
      metadataXML: { Form: { Properties: { FormType: "Managed" } } },
    })

    expect(result.localIndexes.metadata.formDataPathIndex?.getRoot("ПроизвольныйРеквизит")?.typeInfo.kinds).toEqual([
      "any",
    ])
    expect(
      result.localIndexes.metadata.formDataPathIndex
        ?.getRoot("Таблица")
        ?.tableSource?.columns.get("Значение")?.typeInfo.kinds
    ).toEqual(["any"])
  })

  it("уточняет служебный путь CurrentData после построения индекса элементов", () => {
    const result = importValueTableCurrentDataForm(
      { Column: { _name: "Значение", _id: "1", Type: { "v8:Type": "xs:string" } } },
      "Значение"
    )

    finalizeImportedFormDataPaths(result)

    expect(JSON.stringify(result.yaml)).toContain("Элементы.Строки.ТекущиеДанные.Значение")
    expect(JSON.stringify(result.yaml)).not.toContain("Items.Строки.CurrentData.Значение")
  })

  it("преобразует рекурсивные пути SettingsComposer и сохраняет имена элементов", () => {
    const result = importClientApplicationFormFromXMLToYAML({
      context: currentDataImportContext(),
      formName: "Форма",
      formXML: {
        Attributes: {
          Attribute: [{
            _name: "КомпоновщикНастроек",
            _id: "1",
            Type: { "v8:Type": "dcsset:SettingsComposer" },
          }],
        },
        ChildItems: [
          {
            Table: {
              _name: "КомпоновщикНастроекНастройки",
              _id: "2",
              DataPath: "КомпоновщикНастроек.Settings",
            },
          },
          {
            Table: {
              _name: "КомпоновщикНастроекНастройкиЭлементПараметрыДанных",
              _id: "3",
              DataPath: "Items.КомпоновщикНастроекНастройки.CurrentData.ItemDataParameters",
              RowFilter: { "_xsi:nil": "true" },
            },
          },
          {
            InputField: {
              _name: "Параметр",
              _id: "4",
              DataPath: "Items.КомпоновщикНастроекНастройкиЭлементПараметрыДанных.CurrentData.Parameter",
            },
          },
        ],
      },
      metadataXML: { Form: { Properties: { FormType: "Managed" } } },
    })

    finalizeImportedFormDataPaths(result)

    const yaml = result.yaml as ClientApplicationFormYAML
    expect(yaml.Элементы).toMatchObject({
      КомпоновщикНастроекНастройки: {
        ПутьКДанным: "КомпоновщикНастроек.Настройки",
      },
      КомпоновщикНастроекНастройкиЭлементПараметрыДанных: {
        ПутьКДанным: "Элементы.КомпоновщикНастроекНастройки.ТекущиеДанные.ЭлементПараметрыДанных",
      },
      Параметр: {
        ПутьКДанным: "Элементы.КомпоновщикНастроекНастройкиЭлементПараметрыДанных.ТекущиеДанные.Параметр",
      },
    })
    const parameters = yaml.Элементы?.КомпоновщикНастроекНастройкиЭлементПараметрыДанных as unknown as Record<string, unknown>
    expect(parameters.ОтборСтрок).toBe(XML_PRESENT_TAG_VALUE)
    expect(yamlScalarTagAt(parameters, "ОтборСтрок")).toBe("xml/present")
  })

  it("индексирует дополнительные колонки до уточнения CurrentData", () => {
    const result = importValueTableCurrentDataForm(
      {
        AdditionalColumns: {
          _table: "Строки",
          Column: [{
            _name: "Дополнительная",
            _id: "1",
            Type: { "v8:Type": "xs:string" },
          }],
        },
      },
      "Дополнительная"
    )

    expect(
      result.localIndexes.metadata.formDataPathIndex
        ?.additionalColumnsByTablePath.get("Строки")
        ?.get("Дополнительная")
    ).toMatchObject({ name: "Дополнительная" })

    finalizeImportedFormDataPaths(result)

    expect(JSON.stringify(result.yaml)).toContain(
      "Элементы.Строки.ТекущиеДанные.Дополнительная"
    )
  })

  it.each([
    ["PlatformApplication", undefined],
    ["MobilePlatformApplication", "МобильноеПриложение"],
    [["PlatformApplication", "MobilePlatformApplication"], "ПлатформаИМобильноеПриложение"],
  ] as const)("импортирует назначение формы %s", (xmlValue, expectedYAML) => {
    const values = Array.isArray(xmlValue) ? xmlValue : [xmlValue]
    const result = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "Форма",
      formXML: {},
      metadataXML: {
        Form: {
          Properties: {
            FormType: "Managed",
            UsePurposes: {
              "v8:Value": values.map((value) => ({
                "_xsi:type": "app:ApplicationUsePurpose",
                "#text": value,
              })),
            },
          },
        },
      },
    })

    if (expectedYAML === undefined) expect(result.yaml).not.toHaveProperty("НазначенияИспользования")
    else expect(result.yaml).toHaveProperty("НазначенияИспользования", expectedYAML)
  })

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

  it("не импортирует пустое расширенное представление ни в одном варианте формы", () => {
    const metadataXML = {
      Form: {
        Properties: {
          FormType: "Managed",
          ExtendedPresentation: "",
        },
      },
    } as FormMetadataXML

    const specialized = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "ФормаОтчета",
      formXML: {},
      metadataXML,
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })
    expect(specialized.yaml).not.toHaveProperty(
      "РасширенноеПредставление"
    )

    const base = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "ФормаСписка",
      formXML: {},
      metadataXML,
      rule: ClientApplicationFormRules,
    })
    expect(base.yaml).not.toHaveProperty("РасширенноеПредставление")
  })

  it("импортирует заполненное расширенное представление только специализированной формы", () => {
    const metadataXML = {
      Form: {
        Properties: {
          FormType: "Managed",
          ExtendedPresentation: {
            "v8:item": {
              "v8:lang": "ru",
              "v8:content": "Продажи",
            },
          },
        },
      },
    } as FormMetadataXML

    const specialized = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "ФормаОтчета",
      formXML: {},
      metadataXML,
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })
    expect(specialized.yaml).toMatchObject({
      РасширенноеПредставление: "Продажи",
    })

    const base = importClientApplicationFormFromXMLToYAML({
      context: mockContextFromXML(),
      formName: "ФормаСписка",
      formXML: {},
      metadataXML,
      rule: ClientApplicationFormRules,
    })
    expect(base.yaml).not.toHaveProperty("РасширенноеПредставление")
  })

  it("восстанавливает пустой контейнер реквизитов без reference XML", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    form.Form.Attributes = {}
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
    expect(imported.yaml).toHaveProperty("Реквизиты", XML_PRESENT_TAG_VALUE)
    expect(yamlScalarTagAt(imported.yaml, "Реквизиты")).toBe("xml/present")
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

    const imported = importClientApplicationFormFromXMLToYAML({
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
      ])
    )
    expect(identities).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "xmlName" }),
    ]))
    const input = (imported.yaml as ClientApplicationFormYAML).Элементы?.ПолеВвода1 as Record<string, unknown>
    const menu = input.КонтекстноеМеню as Record<string, unknown>
    expect(menu.Имя).toBe("!xml/name НестандартноеКонтекстноеМеню")
    expect(yamlScalarTagAt(menu, "Имя")).toBe("xml/name")
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

  it("не сохраняет скрытые YAML-свойства Form.xml в снимке", () => {
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

    expect(collector.fragment("Форма.yaml").entities).toEqual([{
      logicalAddress,
      uuid: "00000000-0000-4000-8000-000000000001",
    }])
  })

  it("добавляет !проверять metadata формы и сохраняет Extended Form в секции Изменять", () => {
    const collector = createConfigurationIndexCollector()
    const logicalAddress = "Справочник.Контрагенты.Форма.ФормаЭлемента"
    const baseContext = mockXmlImportContext()
    const extensionContext = {
      ...baseContext,
      fromXML: { ...baseContext.fromXML, metadataItemAugmenter: "configurationExtension" },
    }
    const context = withConfigurationIndexCollector(extensionContext, collector, logicalAddress)
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
          ],
        },
      },
    }

    const result = importClientApplicationFormFromXMLToYAML({
      context,
      formName: "ФормаЭлемента",
      formXML: {},
      metadataXML,
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })

    expect(result.yaml).toMatchObject({
      Комментарий: "Комментарий",
      Изменять: ["Форма"],
    })
    expect(yamlScalarTagAt(result.yaml, "РасширенноеПредставление")).toBe("проверять")
    expect(yamlScalarTagAt(result.yaml, "Форма")).toBeUndefined()
    expect(collector.fragment("Форма.yaml").entities).not.toContainEqual(
      expect.objectContaining({ logicalAddress: `${logicalAddress}.form` })
    )
  })

  it("сохраняет пустое расширенное представление заимствованной формы", () => {
    const baseContext = mockXmlImportContext()
    const collector = createConfigurationIndexCollector()
    const extensionContext = {
      ...baseContext,
      fromXML: { ...baseContext.fromXML, metadataItemAugmenter: "configurationExtension" },
    }
    const context = withConfigurationIndexCollector(extensionContext, collector, "ОбщаяФорма.Форма")
    const result = importClientApplicationFormFromXMLToYAML({
      context,
      formName: "Форма",
      formXML: {},
      metadataXML: {
        Form: {
          Properties: {
            ObjectBelonging: "Adopted",
            Name: "Форма",
            FormType: "Managed",
            ExtendedPresentation: "",
          },
        },
      },
      rule: ClientApplicationFormWithExtendedPresentationRules,
    })

    expect(result.yaml).toMatchObject({ РасширенноеПредставление: "" })
  })
})

function identityFacts(entities: readonly ConfigurationIndexBlockEntity[]) {
  return entities.flatMap((entity) =>
    (["uuid", "xmlId"] as const).flatMap((kind) => entity[kind] === undefined ? [] : [{
      logicalAddress: entity.logicalAddress,
      kind,
      value: entity[kind],
    }])
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

  it("сохраняет порядок событий формы без reference XML", () => {
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
      "OnOpen",
      "BeforeClose",
      "ActivationProcessing",
    ])
  })

  it("сохраняет UUID-имена событий как битые ссылки", () => {
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
        "81c01005-9b73-4278-853b-1a8d203c8e8c": "ОбработкаАктивации",
        "ea0a9886-1607-44fe-a446-2cc57548f57d": "ПередВыполнением",
      },
    })
    expect(yamlMappingKeyTagAt(importedForm.События, "81c01005-9b73-4278-853b-1a8d203c8e8c"))
      .toBe("xml/reference")
    expect(yamlMappingKeyTagAt(importedForm.События, "ea0a9886-1607-44fe-a446-2cc57548f57d"))
      .toBe("xml/reference")
    expect(Array.isArray(events) ? events.map((event) => event._name) : []).toEqual([
      "81c01005-9b73-4278-853b-1a8d203c8e8c",
      "ea0a9886-1607-44fe-a446-2cc57548f57d",
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
          ContextMenu: { _id: string; _name: string }
          ExtendedTooltip: { _id: string }
        }
      }>
    )[0]!.InputField
    const sourceCommands = form.Form.Commands?.Command
    const sourceCommand = (Array.isArray(sourceCommands) ? sourceCommands[0] : sourceCommands) as { _id: string }
    sourceAttribute._id = "11"
    sourceInputField._id = "22"
    sourceInputField.ContextMenu._id = "33"
    sourceInputField.ContextMenu._name = "СтароеИмяКонтекстногоМеню"
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
        ContextMenu: expect.objectContaining({ _name: "СтароеИмяКонтекстногоМеню", _id: "33" }),
        ExtendedTooltip: expect.objectContaining({ _name: "ПолеВвода1РасширеннаяПодсказка", _id: "44" }),
      })
    )
    expect(converted.formXML.Commands?.Command).toEqual(
      expect.arrayContaining([expect.objectContaining({ _name: "Команда1", _id: "55" })])
    )
    expect(converted.formXML.AutoCommandBar).toEqual(expect.objectContaining({ _name: "", _id: "-1" }))
  })

  it("восстанавливает имена подсказок вложенных дополнений таблицы без reference XML", () =>
    withMetadataExecutionRegistrySets(createMetadataExecutionRegistrySets(metadataRules), () => {
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
    const tableYAML = findRecordWithValue(imported.yaml, "Вид", "ТаблицаФормы")
    if (tableYAML === undefined) throw new Error("В YAML не найдена таблица")
    const searchStringYAML: Record<string, unknown> = { РасширеннаяПодсказка: {} }
    tableYAML.ОтображениеСтрокиПоиска = searchStringYAML
    searchStringYAML.Имя = xmlAnomalyTagValue("xml/name", "СвязиНеУдаленныхСтрокаПоиска")
    markYAMLScalarTag(searchStringYAML, "Имя", "xml/name")

    const viewStatusTooltipYAML: Record<string, unknown> = {}
    tableYAML.ОтображениеСостоянияПросмотра = { РасширеннаяПодсказка: viewStatusTooltipYAML }
    viewStatusTooltipYAML.Имя = xmlAnomalyTagValue("xml/name", "СобственноеИмяПодсказки")
    markYAMLScalarTag(viewStatusTooltipYAML, "Имя", "xml/name")

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
      "СвязиНеУдаленныхСтрокаПоискаРасширеннаяПодсказка"
    )
    expect(table?.ViewStatusAddition?.ExtendedTooltip?._name).toBe(
      "СобственноеИмяПодсказки"
    )
    expect(table?.SearchControlAddition?.ExtendedTooltip?._name).toBe(
      "ТабличнаяЧастьВсеСвойстваУправлениеПоискомРасширеннаяПодсказка"
    )
  }))

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

  it("восстанавливает обязательный пустой Comment формы без reference XML", () => {
    const form = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
    const metadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml",
    )
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

    expect(imported.yaml).not.toHaveProperty("Комментарий")
    expect(converted.metadataXML.Form.Properties.Comment).toBe("")
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
    const expectedMetadata = structuredClone(metadata.MetaDataObject)
    expectedMetadata.Form.Properties.UsePurposes ??= {
      "v8:Value": {
        "_xsi:type": "app:ApplicationUsePurpose",
        "#text": "PlatformApplication",
      },
    }

    expect(canonicalSnapshot13XML(xmlExport({ Form: converted.formXML }))).toEqual(
      canonicalSnapshot13XML(readXMLFixtureAsString(import.meta.url, formFixture))
    )
    expect(canonicalXML(xmlExport({ MetaDataObject: converted.metadataXML }))).toEqual(
      canonicalXML(xmlExport({ MetaDataObject: expectedMetadata }))
    )
  })
})

function asTestRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function findRecordWithValue(value: unknown, property: string, expected: unknown): Record<string, unknown> | undefined {
  const record = asTestRecord(value)
  if (record === undefined) {
    if (!Array.isArray(value)) return undefined
    for (const item of value) {
      const found = findRecordWithValue(item, property, expected)
      if (found !== undefined) return found
    }
    return undefined
  }
  if (record[property] === expected) return record
  for (const child of Object.values(record)) {
    const found = findRecordWithValue(child, property, expected)
    if (found !== undefined) return found
  }
  return undefined
}

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
    return value.map(normalizeSnapshot13XML)
  }
  if (value === null || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => {
      const normalizedKey = SNAPSHOT_13_XML_NAMES[key] ?? key
      const normalizedChild = normalizeSnapshot13XML(child)
      return [normalizedKey, normalizedKey === "Table" ? withCanonicalTableDefaults(normalizedChild) : normalizedChild]
    })
  )
}

function withCanonicalTableDefaults(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withCanonicalTableDefaults)
  if (value === null || typeof value !== "object") return value
  const table = value as Record<string, unknown>
  return {
    ...table,
    Period: table.Period ?? {
      "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
      "v8:startDate": "0001-01-01T00:00:00",
      "v8:endDate": "0001-01-01T00:00:00",
    },
    TopLevelParent: table.TopLevelParent ?? { "_xsi:nil": "true" },
    RowFilter: table.RowFilter ?? { "_xsi:nil": "true" },
  }
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
