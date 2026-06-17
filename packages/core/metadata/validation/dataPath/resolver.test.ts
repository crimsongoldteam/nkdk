import { describe, expect, it } from "vitest"
import type { TypeDescription } from "~/metadata/commonObjects/typeDescription/types"
import type { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"
import type { FormAttribute } from "~/metadata/forms/commonObjects/formAttribute/types"
import { MetadataAccountingRegisterRules } from "~/metadata/appliedObjects/metadataAccountingRegister/rules"
import { MetadataAccumulationRegisterRules } from "~/metadata/appliedObjects/metadataAccumulationRegister/rules"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { MetadataChartOfAccountsRules } from "~/metadata/appliedObjects/metadataChartOfAccounts/rules"
import { MetadataChartOfCalculationTypesRules } from "~/metadata/appliedObjects/metadataChartOfCalculationTypes/rules"
import { MetadataChartOfCharacteristicTypesRules } from "~/metadata/appliedObjects/metadataChartOfCharacteristicTypes/rules"
import { MetadataConstantRules } from "~/metadata/appliedObjects/metadataConstant/rules"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import { MetadataExchangePlanRules } from "~/metadata/appliedObjects/metadataExchangePlan/rules"
import { MetadataInformationRegisterRules } from "~/metadata/appliedObjects/metadataInformationRegister/rules"
import { MetadataReportRules } from "~/metadata/appliedObjects/metadataReport/rules"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import { buildFormDataPathIndex, type FormDataPathIndex } from "./formIndex"
import { buildObjectFieldIndex } from "./objectFields"
import type { OwnerMetadata, OwnerMetadataCache, OwnerMetadataResult } from "./ownerCache"
import { resolveDataPath } from "./resolver"

describe("resolveDataPath", () => {
  it("resolves a valid form attribute", () => {
    const result = resolve("ПометкаУдаления", {
      index: indexWithAttributes([attribute("ПометкаУдаления", { type: ["boolean"] })]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "ПометкаУдаления",
        segments: ["ПометкаУдаления"],
        source: { kind: "formAttribute", name: "ПометкаУдаления" },
        typeInfo: { kinds: ["boolean"] },
      },
    })
  })

  it("resolves a valid ValueTable column", () => {
    const result = resolve("Товары.Количество", {
      index: indexWithAttributes([
        attribute("Товары", { type: ["ValueTable"] }, [column("Количество", { type: ["decimal"] })]),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Товары.Количество",
        segments: ["Товары", "Количество"],
        source: { kind: "tableColumn", table: "Товары", name: "Количество" },
        typeInfo: { kinds: ["scalar"], sourceText: "decimal" },
      },
    })
  })

  it("resolves ValueList virtual columns", () => {
    const cases = [
      ["Список.Value", "Value", { kinds: ["scalar"], sourceText: "ValueList.Value" }],
      ["Список.Presentation", "Presentation", { kinds: ["scalar"], sourceText: "ValueList.Presentation" }],
      ["Список.Check", "Check", { kinds: ["boolean"], sourceText: "ValueList.Check" }],
      ["Список.Picture", "Picture", { kinds: ["Picture"], sourceText: "ValueList.Picture" }],
    ] as const

    for (const [path, columnName, typeInfo] of cases) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Список", { type: ["ValueListType"] })]),
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "tableColumn", table: "Список", name: columnName },
          typeInfo,
        },
      })
    }
  })

  it("reports unknown ValueList virtual columns as errors", () => {
    const result = resolve("Список.Unknown", {
      index: indexWithAttributes([attribute("Список", { type: ["ValueListType"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Список.Unknown": неизвестная колонка "Unknown"',
        }),
      ],
    })
  })

  it("resolves GanttChart as a table source", () => {
    const result = resolve("ДиаграммаГанта", {
      index: indexWithAttributes([attribute("ДиаграммаГанта", { type: ["GanttChart"] })]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "ДиаграммаГанта",
        segments: ["ДиаграммаГанта"],
        source: { kind: "formAttribute", name: "ДиаграммаГанта" },
        typeInfo: { kinds: ["tableSource"], table: { kind: "GanttChart" }, sourceText: "GanttChart" },
      },
    })
  })

  it("resolves GanttChart virtual columns", () => {
    const cases = [
      ["ДиаграммаГанта.Point", "Point"],
      ["ДиаграммаГанта.Text", "Text"],
    ] as const

    for (const [path, columnName] of cases) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("ДиаграммаГанта", { type: ["ДиаграммаГанта"] })]),
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "tableColumn", table: "ДиаграммаГанта", name: columnName },
          typeInfo: { kinds: ["scalar"], sourceText: `GanttChart.${columnName}` },
        },
      })
    }
  })

  it("reports unknown GanttChart virtual columns as errors", () => {
    const result = resolve("ДиаграммаГанта.Unknown", {
      index: indexWithAttributes([attribute("ДиаграммаГанта", { type: ["GanttChart"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "ДиаграммаГанта.Unknown": неизвестная колонка "Unknown"',
        }),
      ],
    })
  })

  it("resolves an indexed ValueTable root as a row column path", () => {
    const result = resolve("Товары[0].Количество", {
      index: indexWithAttributes([
        attribute("Товары", { type: ["ValueTable"] }, [column("Количество", { type: ["decimal"] })]),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Товары[0].Количество",
        segments: ["Товары[0]", "Количество"],
        source: { kind: "tableColumn", table: "Товары", name: "Количество" },
        typeInfo: { kinds: ["scalar"], sourceText: "decimal" },
      },
    })
  })

  it("resolves indexed ValueTable column names as row column paths", () => {
    const result = resolve("Товары[0].Количество[0]", {
      index: indexWithAttributes([
        attribute("Товары", { type: ["ValueTable"] }, [column("Количество", { type: ["decimal"] })]),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Товары[0].Количество[0]",
        segments: ["Товары[0]", "Количество[0]"],
        source: { kind: "tableColumn", table: "Товары", name: "Количество" },
        typeInfo: { kinds: ["scalar"], sourceText: "decimal" },
      },
    })
  })

  it("resolves nested indexed ValueTable columns through additional columns", () => {
    const result = resolve("Доверенность[0].Документ[0].Довер[0].НомДовер", {
      index: indexWithAttributes([
        {
          ...attribute("Доверенность", { type: ["ValueTable"] }, [
            column("Документ", { type: ["ValueTable"] }),
          ]),
          additionalColumns: [
            {
              table: "Доверенность.Документ",
              columns: [column("Довер", { type: ["ValueTable"] })],
            },
            {
              table: "Доверенность.Документ.Довер",
              columns: [column("НомДовер", { type: ["string"] })],
            },
          ],
        } as FormAttribute,
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Доверенность[0].Документ[0].Довер[0].НомДовер",
        segments: ["Доверенность[0]", "Документ[0]", "Довер[0]", "НомДовер"],
        source: { kind: "tableColumn", table: "Довер", name: "НомДовер" },
        typeInfo: { kinds: ["scalar"], sourceText: "string" },
      },
    })
  })

  it("keeps unknown nested indexed ValueTable columns as errors", () => {
    const result = resolve("Доверенность[0].Документ[0].НетТакойКолонки", {
      index: indexWithAttributes([
        {
          ...attribute("Доверенность", { type: ["ValueTable"] }, [
            column("Документ", { type: ["ValueTable"] }),
          ]),
          additionalColumns: [
            {
              table: "Доверенность.Документ",
              columns: [column("Довер", { type: ["ValueTable"] })],
            },
          ],
        } as FormAttribute,
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message:
            'ПутьКДанным "Доверенность[0].Документ[0].НетТакойКолонки": неизвестная колонка "НетТакойКолонки"',
        }),
      ],
    })
  })

  it("reports a missing first segment without falling back to owner names", () => {
    const result = resolve("Объект.Наименование", {
      index: indexWithAttributes([attribute("Реквизит", { type: ["string"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          severity: "error",
          message: 'ПутьКДанным "Объект.Наименование": неизвестный корень "Объект"',
        }),
      ],
    })
  })

  it("uses strict case-sensitive root lookup", () => {
    const result = resolve("объект.Наименование", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "объект.Наименование": неизвестный корень "объект"',
        }),
      ],
    })
  })

  it("reports an intermediate composite type", () => {
    const result = resolve("Контрагент.Наименование", {
      index: indexWithAttributes([
        attribute("Контрагент", { type: ["CatalogRef.Контрагенты", "CatalogRef.Партнеры"] }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          message: 'ПутьКДанным "Контрагент.Наименование": промежуточный реквизит "Контрагент" имеет составной тип',
        }),
      ],
    })
  })

  it("reports an intermediate composite object and scalar type", () => {
    const result = resolve("Контрагент.Наименование", {
      index: indexWithAttributes([
        attribute("Контрагент", { type: ["CatalogRef.Контрагенты", "string"] }),
      ]),
      ownerCache: ownerCache([owner({ ref: { kind: "Справочник", name: "Контрагенты" } })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          message: 'ПутьКДанным "Контрагент.Наименование": промежуточный реквизит "Контрагент" имеет составной тип',
        }),
      ],
    })
  })

  it("reports an intermediate composite table and scalar type before resolving columns", () => {
    const result = resolve("Товары.Количество", {
      index: indexWithAttributes([
        attribute("Товары", { type: ["ValueTable", "string"] }, [column("Количество", { type: ["decimal"] })]),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          message: 'ПутьКДанным "Товары.Количество": промежуточный реквизит "Товары" имеет составной тип',
        }),
      ],
    })
  })

  it("reports an intermediate unknown type", () => {
    const result = resolve("Реквизит.Поле", {
      index: indexWithAttributes([attribute("Реквизит", undefined)]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Реквизит.Поле": промежуточный реквизит "Реквизит" имеет неизвестный тип',
        }),
      ],
    })
  })

  it("reports an unsupported intermediate type", () => {
    const result = resolve("Хранилище.Поле", {
      index: indexWithAttributes([attribute("Хранилище", { type: ["ValueStorage"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Хранилище.Поле": промежуточный реквизит "Хранилище" имеет неподдерживаемый тип',
        }),
      ],
    })
  })

  it("resolves an owner attribute through OwnerMetadataCache", () => {
    const result = resolve("Объект.Артикул", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Справочник", name: "Номенклатура" },
          rule: MetadataCatalogRules,
          model: {
            itemType: "MetadataCatalog",
            attributes: [{ name: "Артикул", type: { type: ["string"] } }],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Артикул",
        segments: ["Объект", "Артикул"],
        source: { kind: "objectField", owner: { kind: "Справочник", name: "Номенклатура" }, name: "Артикул" },
        typeInfo: { kinds: ["scalar"], sourceText: "string" },
      },
    })
  })

  it("resolves a tabular section column through owner metadata", () => {
    const result = resolve("Объект.Товары.Номенклатура", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: {
            itemType: "MetadataDocument",
            tabularSections: [
              {
                itemType: "MetadataTabularSection",
                name: "Товары",
                attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
              },
            ],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Товары.Номенклатура",
        segments: ["Объект", "Товары", "Номенклатура"],
        source: { kind: "tableColumn", table: "Товары", name: "Номенклатура" },
        typeInfo: { nextTypes: [{ kind: "Справочник", name: "Номенклатура" }] },
      },
    })
  })

  it("resolves an indexed owner tabular section as a row column path", () => {
    const result = resolve("Объект.Товары[0].Номенклатура", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: {
            itemType: "MetadataDocument",
            tabularSections: [
              {
                itemType: "MetadataTabularSection",
                name: "Товары",
                attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
              },
            ],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Товары[0].Номенклатура",
        segments: ["Объект", "Товары[0]", "Номенклатура"],
        source: { kind: "tableColumn", table: "Товары", name: "Номенклатура" },
        typeInfo: { nextTypes: [{ kind: "Справочник", name: "Номенклатура" }] },
      },
    })
  })

  it("resolves an owner tabular section column through form additional columns", () => {
    const result = resolve("Объект.Товары.Артикул", {
      index: indexWithAttributes([
        {
          ...attribute("Объект", { type: ["DocumentRef.Заказ"] }),
          additionalColumns: [
            {
              table: "Объект.Товары",
              columns: [column("Артикул", { type: ["string"] })],
            },
          ],
        } as FormAttribute,
      ]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: {
            itemType: "MetadataDocument",
            tabularSections: [
              {
                itemType: "MetadataTabularSection",
                name: "Товары",
                attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
              },
            ],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Товары.Артикул",
        segments: ["Объект", "Товары", "Артикул"],
        source: { kind: "tableColumn", table: "Товары", name: "Артикул" },
        typeInfo: { kinds: ["scalar"], sourceText: "string" },
      },
    })
  })

  it("keeps unknown tabular section columns as errors when no additional column exists", () => {
    const result = resolve("Объект.Товары.Артикул", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: {
            itemType: "MetadataDocument",
            tabularSections: [
              {
                itemType: "MetadataTabularSection",
                name: "Товары",
                attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
              },
            ],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.Товары.Артикул": неизвестная колонка "Артикул"',
        }),
      ],
    })
  })

  it("resolves owner form-only table paths through form additional columns", () => {
    const result = resolve("Отчет.ТабПравилаВычисленияПараметров", {
      index: indexWithAttributes([reportWithFormOnlyTable()]),
      ownerCache: reportOwnerCache(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Отчет.ТабПравилаВычисленияПараметров",
        segments: ["Отчет", "ТабПравилаВычисленияПараметров"],
        source: {
          kind: "objectField",
          owner: { kind: "ОтчетОбъект", name: "АнализТрансляцииПроводок" },
          name: "ТабПравилаВычисленияПараметров",
        },
        typeInfo: { kinds: ["tableSource"], table: { kind: "ValueTable" } },
      },
    })
  })

  it("resolves owner form-only table columns through form additional columns", () => {
    const result = resolve("Отчет.ТабПравилаВычисленияПараметров.ПолеБД", {
      index: indexWithAttributes([reportWithFormOnlyTable()]),
      ownerCache: reportOwnerCache(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Отчет.ТабПравилаВычисленияПараметров.ПолеБД",
        segments: ["Отчет", "ТабПравилаВычисленияПараметров", "ПолеБД"],
        source: { kind: "tableColumn", table: "ТабПравилаВычисленияПараметров", name: "ПолеБД" },
        typeInfo: { kinds: ["scalar"], sourceText: "string" },
      },
    })
  })

  it("resolves indexed owner form-only table columns through normalized additional columns paths", () => {
    const result = resolve("Отчет.СписокВидовСубконто[0].Value", {
      index: indexWithAttributes([reportWithFormOnlyTable()]),
      ownerCache: reportOwnerCache(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Отчет.СписокВидовСубконто[0].Value",
        segments: ["Отчет", "СписокВидовСубконто[0]", "Value"],
        source: { kind: "tableColumn", table: "СписокВидовСубконто", name: "Value" },
        typeInfo: { kinds: ["scalar"], sourceText: "string" },
      },
    })
  })

  it("keeps unknown owner form-only table columns as errors", () => {
    const result = resolve("Отчет.ТабПравилаВычисленияПараметров.НетТакойКолонки", {
      index: indexWithAttributes([reportWithFormOnlyTable()]),
      ownerCache: reportOwnerCache(),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message:
            'ПутьКДанным "Отчет.ТабПравилаВычисленияПараметров.НетТакойКолонки": неизвестная колонка "НетТакойКолонки"',
        }),
      ],
    })
  })

  it("keeps missing owner form-only table paths without additional columns as unknown attributes", () => {
    const result = resolve("Отчет.ТабПравилаВычисленияПараметров.ПолеБД", {
      index: indexWithAttributes([attribute("Отчет", { type: ["ReportObject.АнализТрансляцииПроводок"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "ОтчетОбъект", name: "АнализТрансляцииПроводок" },
          rule: MetadataReportRules,
          model: { itemType: "MetadataReport" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message:
            'ПутьКДанным "Отчет.ТабПравилаВычисленияПараметров.ПолеБД": неизвестный реквизит "ТабПравилаВычисленияПараметров"',
        }),
      ],
    })
  })

  it("resolves owner ValueList virtual columns", () => {
    const owners = ownerCache([
      owner({
        ref: { kind: "ОтчетОбъект", name: "АнализСубконто" },
        rule: MetadataReportRules,
        model: {
          itemType: "MetadataReport",
          attributes: [
            { name: "СписокВидовСубконто", type: { type: ["ValueListType"] } },
            { name: "СписокВидовКорСубконто", type: { type: ["СписокЗначений"] } },
          ],
        },
      }),
    ])

    for (const [path, columnName, sourceText] of [
      ["Отчет.СписокВидовСубконто.Value", "Value", "ValueList.Value"],
      ["Отчет.СписокВидовСубконто.Picture", "Picture", "ValueList.Picture"],
      ["Отчет.СписокВидовКорСубконто[0].Value", "Value", "ValueList.Value"],
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Отчет", { type: ["ReportObject.АнализСубконто"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "tableColumn", name: columnName },
          typeInfo: { sourceText },
        },
      })
    }
  })

  it("keeps unknown owner ValueList columns as errors", () => {
    const result = resolve("Отчет.СписокВидовСубконто.Unknown", {
      index: indexWithAttributes([attribute("Отчет", { type: ["ReportObject.АнализСубконто"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "ОтчетОбъект", name: "АнализСубконто" },
          rule: MetadataReportRules,
          model: {
            itemType: "MetadataReport",
            attributes: [{ name: "СписокВидовСубконто", type: { type: ["ValueListType"] } }],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Отчет.СписокВидовСубконто.Unknown": неизвестная колонка "Unknown"',
        }),
      ],
    })
  })

  it("resolves document RegisterRecords fields through document movements", () => {
    const result = resolve("Объект.RegisterRecords.Продажи.Period", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.RegisterRecords.Продажи.Period",
        segments: ["Объект", "RegisterRecords", "Продажи", "Period"],
        source: { kind: "tableColumn", table: "Продажи", name: "Период" },
      },
    })
  })

  it("resolves document НаборЗаписей fields as a RegisterRecords alias", () => {
    const result = resolve("Объект.НаборЗаписей.Продажи.Active", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.НаборЗаписей.Продажи.Active",
        source: { kind: "tableColumn", table: "Продажи", name: "Активность" },
      },
    })
  })

  it("reports unknown document RegisterRecords names as errors", () => {
    const result = resolve("Объект.RegisterRecords.НетТакогоРегистра.Period", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message:
            'ПутьКДанным "Объект.RegisterRecords.НетТакогоРегистра.Period": неизвестный регистр движений "НетТакогоРегистра"',
        }),
      ],
    })
  })

  it("keeps unknown RegisterRecords columns as errors", () => {
    const result = resolve("Объект.RegisterRecords.Продажи.UnknownColumn", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.RegisterRecords.Продажи.UnknownColumn": неизвестная колонка "UnknownColumn"',
        }),
      ],
    })
  })

  it("resolves form register record set attributes as table sources", () => {
    const result = resolve("НаборЗаписей.Количество", {
      index: indexWithAttributes([attribute("НаборЗаписей", { type: ["InformationRegisterRecordSet.Продажи"] })]),
      ownerCache: documentWithRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "НаборЗаписей.Количество",
        source: { kind: "tableColumn", table: "НаборЗаписей", name: "Количество" },
        typeInfo: { kinds: ["scalar"], sourceText: "decimal" },
      },
    })
  })

  it("resolves form-only RegisterRecordSet columns from form attribute columns", () => {
    const result = resolve("НаборЗаписей.ПериодГод", {
      index: indexWithAttributes([
        attribute("НаборЗаписей", { type: ["InformationRegisterRecordSet.Продажи"] }, [
          column("ПериодГод", { type: ["decimal"] }),
        ]),
      ]),
      ownerCache: documentWithRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "НаборЗаписей.ПериодГод",
        source: { kind: "tableColumn", table: "НаборЗаписей", name: "ПериодГод" },
        typeInfo: { kinds: ["scalar"], sourceText: "decimal" },
      },
    })
  })

  it("keeps RegisterRecordSet standard columns available with form-only columns", () => {
    const result = resolve("НаборЗаписей.Period", {
      index: indexWithAttributes([
        attribute("НаборЗаписей", { type: ["InformationRegisterRecordSet.Продажи"] }, [
          column("ПериодГод", { type: ["decimal"] }),
        ]),
      ]),
      ownerCache: documentWithRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        source: { kind: "tableColumn", table: "НаборЗаписей", name: "Период" },
        typeInfo: { kinds: ["dateTime"], sourceText: "RegisterRecordSet.Period" },
      },
    })
  })

  it("keeps unknown RegisterRecordSet columns strict without form-only columns", () => {
    const result = resolve("НаборЗаписей.НетТакойКолонки", {
      index: indexWithAttributes([
        attribute("НаборЗаписей", { type: ["InformationRegisterRecordSet.Продажи"] }, [
          column("ПериодГод", { type: ["decimal"] }),
        ]),
      ]),
      ownerCache: documentWithRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "НаборЗаписей.НетТакойКолонки": неизвестная колонка "НетТакойКолонки"',
        }),
      ],
    })
  })

  it("resolves accounting RegisterRecords account columns from chart of accounts", () => {
    const owners = documentWithAccountingRegisterRecords()

    for (const path of [
      "Объект.RegisterRecords.Хозрасчетный.Account",
      "Объект.RegisterRecords.Хозрасчетный.AccountDr",
      "Объект.RegisterRecords.Хозрасчетный.AccountCr",
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Операция"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "tableColumn", table: "Хозрасчетный" },
          typeInfo: {
            kinds: ["object"],
            nextTypes: [{ kind: "ПланСчетов", name: "Хозрасчетный" }],
            sourceText: "ChartOfAccounts.Хозрасчетный",
          },
        },
      })
    }
  })

  it("resolves accounting RegisterRecords ext dimensions as any columns", () => {
    const owners = documentWithAccountingRegisterRecords()

    for (const path of [
      "Объект.RegisterRecords.Хозрасчетный.ExtDimension1",
      "Объект.RegisterRecords.Хозрасчетный.ExtDimensionDr1",
      "Объект.RegisterRecords.Хозрасчетный.ExtDimensionCr1",
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Операция"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "tableColumn", table: "Хозрасчетный" },
          typeInfo: { kinds: ["any"], sourceText: "AccountingRegisterRecordSet.ExtDimension" },
        },
      })
    }
  })

  it("resolves accounting RegisterRecords debit and credit fields from base register fields", () => {
    const owners = documentWithAccountingRegisterRecords()

    expect(
      resolve("Объект.RegisterRecords.Хозрасчетный.ВалютаDr", {
        index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Операция"] })]),
        ownerCache: owners,
      }),
    ).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        source: { kind: "tableColumn", table: "Хозрасчетный", name: "ВалютаDr" },
        typeInfo: {
          kinds: ["object"],
          nextTypes: [{ kind: "Справочник", name: "Валюты" }],
          sourceText: "CatalogRef.Валюты",
        },
      },
    })

    expect(
      resolve("Объект.RegisterRecords.Хозрасчетный.КоличествоCr", {
        index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Операция"] })]),
        ownerCache: owners,
      }),
    ).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        source: { kind: "tableColumn", table: "Хозрасчетный", name: "КоличествоCr" },
        typeInfo: { kinds: ["scalar"], sourceText: "decimal" },
      },
    })
  })

  it("keeps unknown accounting RegisterRecords columns as errors", () => {
    const result = resolve("Объект.RegisterRecords.Хозрасчетный.UnknownAccountingColumn", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Операция"] })]),
      ownerCache: documentWithAccountingRegisterRecords(),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message:
            'ПутьКДанным "Объект.RegisterRecords.Хозрасчетный.UnknownAccountingColumn": неизвестная колонка "UnknownAccountingColumn"',
        }),
      ],
    })
  })

  it("does not resolve accounting virtual columns for accumulation RegisterRecords", () => {
    const owners = ownerCache([
      owner({
        ref: { kind: "Документ", name: "Операция" },
        rule: MetadataDocumentRules,
        model: {
          itemType: "MetadataDocument",
          registerRecords: ["AccumulationRegister.Остатки"],
        },
      }),
      owner({
        ref: { kind: "РегистрНакопления", name: "Остатки" },
        rule: MetadataAccumulationRegisterRules,
        model: {
          itemType: "MetadataAccumulationRegister",
          resources: [{ name: "Количество", type: { type: ["decimal"] } }],
        },
      }),
    ])

    for (const path of [
      "Объект.RegisterRecords.Остатки.AccountDr",
      "Объект.RegisterRecords.Остатки.ExtDimensionDr1",
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Операция"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "error",
        diagnostics: [
          expect.objectContaining({
            message: `ПутьКДанным "${path}": неизвестная колонка "${path.split(".").at(-1)}"`,
          }),
        ],
      })
    }
  })

  it("resolves ChartOfAccounts ExtDimensionTypes as a virtual table", () => {
    const result = resolve("Объект.ExtDimensionTypes", {
      index: indexWithAttributes([attribute("Объект", { type: ["ChartOfAccountsRef.Хозрасчетный"] })]),
      ownerCache: chartOfAccountsOwners(),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.ExtDimensionTypes",
        segments: ["Объект", "ExtDimensionTypes"],
        source: { kind: "objectField", owner: { kind: "ПланСчетов", name: "Хозрасчетный" }, name: "ExtDimensionTypes" },
        typeInfo: { kinds: ["tableSource"], table: { kind: "ValueTable" } },
      },
    })
  })

  it("resolves ChartOfAccounts ExtDimensionTypes virtual columns", () => {
    const owners = chartOfAccountsOwners()

    expect(
      resolve("Объект.ExtDimensionTypes.ExtDimensionType", {
        index: indexWithAttributes([attribute("Объект", { type: ["ChartOfAccountsRef.Хозрасчетный"] })]),
        ownerCache: owners,
      }),
    ).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        source: { kind: "tableColumn", table: "ExtDimensionTypes", name: "ExtDimensionType" },
        typeInfo: {
          kinds: ["object"],
          nextTypes: [{ kind: "ПланВидовХарактеристик", name: "ВидыСубконтоХозрасчетные" }],
          sourceText: "ChartOfCharacteristicTypes.ВидыСубконтоХозрасчетные",
        },
      },
    })

    for (const path of [
      "Объект.ExtDimensionTypes.TurnoversOnly",
      "Объект.ExtDimensionTypes.ТолькоСальдо",
      "Объект.ExtDimensionTypes.Валютный",
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["ChartOfAccountsRef.Хозрасчетный"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          typeInfo: { kinds: ["boolean"] },
        },
      })
    }
  })

  it("keeps unknown ChartOfAccounts ExtDimensionTypes columns as errors", () => {
    const result = resolve("Объект.ExtDimensionTypes.Unknown", {
      index: indexWithAttributes([attribute("Объект", { type: ["ChartOfAccountsRef.Хозрасчетный"] })]),
      ownerCache: chartOfAccountsOwners(),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.ExtDimensionTypes.Unknown": неизвестная колонка "Unknown"',
        }),
      ],
    })
  })

  it("keeps ExtDimensionTypes scoped to ChartOfAccounts owners", () => {
    const result = resolve("Объект.ExtDimensionTypes", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
      ownerCache: ownerCache([owner({ ref: { kind: "Справочник", name: "Номенклатура" } })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.ExtDimensionTypes": неизвестный реквизит "ExtDimensionTypes"',
        }),
      ],
    })
  })

  it("resolves ChartOfAccounts virtual owner fields", () => {
    const owners = chartOfAccountsOwners()

    for (const [path, kinds, sourceText] of [
      ["Объект.Order", ["scalar"], "ChartOfAccounts.Order"],
      ["Объект.Type", ["scalar"], "ChartOfAccounts.Type"],
      ["Объект.OffBalance", ["boolean"], "ChartOfAccounts.OffBalance"],
      ["Объект.Валютный", ["boolean"], "ChartOfAccounts.AccountingFlag"],
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["ChartOfAccountsRef.Хозрасчетный"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "objectField", owner: { kind: "ПланСчетов", name: "Хозрасчетный" } },
          typeInfo: { kinds, sourceText },
        },
      })
    }
  })

  it("keeps ChartOfAccounts virtual owner fields strict", () => {
    const missingAccountingFlag = resolve("Объект.НалоговыйУчет", {
      index: indexWithAttributes([attribute("Объект", { type: ["ChartOfAccountsRef.Хозрасчетный"] })]),
      ownerCache: chartOfAccountsOwners(),
    })

    expect(missingAccountingFlag).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.НалоговыйУчет": неизвестный реквизит "НалоговыйУчет"',
        }),
      ],
    })

    const wrongOwner = resolve("Объект.OffBalance", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
      ownerCache: ownerCache([owner({ ref: { kind: "Справочник", name: "Номенклатура" } })]),
    })

    expect(wrongOwner).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.OffBalance": неизвестный реквизит "OffBalance"',
        }),
      ],
    })
  })

  it("resolves ChartOfCalculationTypes virtual owner tables", () => {
    const owners = chartOfCalculationTypesOwners()

    for (const path of [
      "Объект.BaseCalculationTypes",
      "Объект.LeadingCalculationTypes",
      "Объект.DisplacingCalculationTypes",
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["ChartOfCalculationTypesRef.Начисления"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "objectField", owner: { kind: "ПланВидовРасчета", name: "Начисления" } },
          typeInfo: { kinds: ["tableSource"], table: { kind: "ValueTable" } },
        },
      })
    }

    expect(
      resolve("Объект.BaseCalculationTypes.CalculationType", {
        index: indexWithAttributes([attribute("Объект", { type: ["ChartOfCalculationTypesRef.Начисления"] })]),
        ownerCache: owners,
      }),
    ).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        source: { kind: "tableColumn", table: "BaseCalculationTypes", name: "CalculationType" },
        typeInfo: {
          kinds: ["object"],
          nextTypes: [{ kind: "ПланВидовРасчета", name: "Начисления" }],
          sourceText: "ChartOfCalculationTypes.Начисления",
        },
      },
    })
  })

  it("keeps ChartOfCalculationTypes virtual tables strict", () => {
    const unknownColumn = resolve("Объект.BaseCalculationTypes.Unknown", {
      index: indexWithAttributes([attribute("Объект", { type: ["ChartOfCalculationTypesRef.Начисления"] })]),
      ownerCache: chartOfCalculationTypesOwners(),
    })

    expect(unknownColumn).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.BaseCalculationTypes.Unknown": неизвестная колонка "Unknown"',
        }),
      ],
    })

    const wrongOwner = resolve("Объект.BaseCalculationTypes", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
      ownerCache: ownerCache([owner({ ref: { kind: "Справочник", name: "Номенклатура" } })]),
    })

    expect(wrongOwner).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.BaseCalculationTypes": неизвестный реквизит "BaseCalculationTypes"',
        }),
      ],
    })
  })

  it("resolves RowsCount as a virtual table column", () => {
    const title = resolve("Объект.Товары.RowsCount", {
      yamlPath: ["Элементы", "Страница", "ПутьКДаннымЗаголовка"],
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithGoods(),
    })
    const dataPath = resolve("Объект.Товары.RowsCount", {
      yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithGoods(),
    })

    for (const result of [title, dataPath]) {
      expect(result).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          source: { kind: "tableColumn", table: "Товары", name: "RowsCount" },
          typeInfo: { kinds: ["scalar"], sourceText: "RowsCount" },
        },
      })
    }
  })

  it("resolves Total columns as virtual table columns", () => {
    const footer = resolve("Объект.Товары.TotalСумма", {
      yamlPath: ["Элементы", "Товары", "Элементы", "Сумма", "ПутьКДаннымПодвала"],
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithGoods(),
    })
    const dataPath = resolve("Объект.Товары.TotalСумма", {
      yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithGoods(),
    })

    for (const result of [footer, dataPath]) {
      expect(result).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          source: { kind: "tableColumn", table: "Товары", name: "TotalСумма" },
          typeInfo: { kinds: ["scalar"], sourceText: "Total" },
        },
      })
    }
  })

  it("keeps virtual table columns scoped to table sources", () => {
    const rowsCount = resolve("Объект.RowsCount", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithGoods(),
    })
    const total = resolve("Объект.TotalСумма", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: documentWithGoods(),
    })

    expect(rowsCount).toMatchObject({
      status: "error",
      diagnostics: [expect.objectContaining({ message: 'ПутьКДанным "Объект.RowsCount": неизвестный реквизит "RowsCount"' })],
    })
    expect(total).toMatchObject({
      status: "error",
      diagnostics: [expect.objectContaining({ message: 'ПутьКДанным "Объект.TotalСумма": неизвестный реквизит "TotalСумма"' })],
    })
  })

  it("resolves a constant from a constants set as a boolean terminal", () => {
    const result = resolve("НаборКонстант.ИспользоватьСинхронизациюДанных", {
      index: indexWithAttributes([attribute("НаборКонстант", { type: ["ConstantsSet"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Константа", name: "ИспользоватьСинхронизациюДанных" },
          rule: MetadataConstantRules,
          model: {
            itemType: "MetadataConstant",
            type: { type: ["boolean"] },
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "НаборКонстант.ИспользоватьСинхронизациюДанных",
        segments: ["НаборКонстант", "ИспользоватьСинхронизациюДанных"],
        source: { kind: "constant", name: "ИспользоватьСинхронизациюДанных" },
        typeInfo: { kinds: ["boolean"], sourceText: "boolean" },
      },
    })
  })

  it("resolves a constant from a constants set as an object terminal", () => {
    const result = resolve("Константы.ВалютаУправленческогоУчета", {
      index: indexWithAttributes([attribute("Константы", { type: ["ConstantsSet"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Константа", name: "ВалютаУправленческогоУчета" },
          rule: MetadataConstantRules,
          model: {
            itemType: "MetadataConstant",
            type: { type: ["CatalogRef.Валюты"] },
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Константы.ВалютаУправленческогоУчета",
        source: { kind: "constant", name: "ВалютаУправленческогоУчета" },
        typeInfo: {
          kinds: ["object"],
          nextTypes: [{ kind: "Справочник", name: "Валюты" }],
          sourceText: "CatalogRef.Валюты",
        },
      },
    })
  })

  it("reports a missing constant owner from a constants set", () => {
    const result = resolve("НаборКонстант.НетТакойКонстанты", {
      index: indexWithAttributes([attribute("НаборКонстант", { type: ["ConstantsSet"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "cross-file",
          severity: "error",
          message: "Не найден владелец",
        }),
      ],
    })
  })

  it("does not allow traversing through a scalar constant", () => {
    const result = resolve("НаборКонстант.ИспользоватьСинхронизациюДанных.Code", {
      index: indexWithAttributes([attribute("НаборКонстант", { type: ["ConstantsSet"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Константа", name: "ИспользоватьСинхронизациюДанных" },
          rule: MetadataConstantRules,
          model: {
            itemType: "MetadataConstant",
            type: { type: ["boolean"] },
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message:
            'ПутьКДанным "НаборКонстант.ИспользоватьСинхронизациюДанных.Code": промежуточный реквизит "ИспользоватьСинхронизациюДанных" не является объектом',
        }),
      ],
    })
  })

  it("resolves LineNumber as an alias for the YAML row number column", () => {
    const result = resolve("Объект.Товары.LineNumber", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: {
            itemType: "MetadataDocument",
            tabularSections: [
              {
                itemType: "MetadataTabularSection",
                name: "Товары",
                attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
              },
            ],
          },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Товары.LineNumber",
        segments: ["Объект", "Товары", "LineNumber"],
        source: { kind: "tableColumn", table: "Товары", name: "НомерСтроки" },
      },
    })
  })

  it("resolves Date as an alias for the YAML standard attribute name", () => {
    const result = resolve("Объект.Date", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: { itemType: "MetadataDocument" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Date",
        segments: ["Объект", "Date"],
        source: { kind: "objectField", owner: { kind: "Документ", name: "Заказ" }, name: "Дата" },
      },
    })
  })

  it("resolves platform standard attribute aliases through owner metadata", () => {
    const result = resolve("Объект.Number", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: { itemType: "MetadataDocument" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Number",
        segments: ["Объект", "Number"],
        source: { kind: "objectField", owner: { kind: "Документ", name: "Заказ" }, name: "Номер" },
      },
    })
  })

  it("resolves catalog platform standard aliases through owner metadata", () => {
    const owners = ownerCache([owner({ ref: { kind: "Справочник", name: "Номенклатура" } })])

    for (const [path, yamlName] of [
      ["Объект.Description", "Наименование"],
      ["Объект.Code", "Код"],
      ["Объект.Ref", "Ссылка"],
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "objectField", owner: { kind: "Справочник", name: "Номенклатура" }, name: yamlName },
        },
      })
    }
  })

  it("resolves platform aliases after traversing a reference column", () => {
    const result = resolve("Объект.Товары.Номенклатура.Code", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: {
            itemType: "MetadataDocument",
            tabularSections: [
              {
                itemType: "MetadataTabularSection",
                name: "Товары",
                attributes: [{ name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } }],
              },
            ],
          },
        }),
        owner({ ref: { kind: "Справочник", name: "Номенклатура" } }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.Товары.Номенклатура.Code",
        source: { kind: "objectField", owner: { kind: "Справочник", name: "Номенклатура" }, name: "Код" },
      },
    })
  })

  it("resolves ValueType as a terminal type description standard attribute", () => {
    const result = resolve("Объект.ValueType", {
      index: indexWithAttributes([attribute("Объект", { type: ["ChartOfCharacteristicTypesRef.ВидыСубконто"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "ПланВидовХарактеристик", name: "ВидыСубконто" },
          rule: MetadataChartOfCharacteristicTypesRules,
          model: { itemType: "MetadataChartOfCharacteristicTypes" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Объект.ValueType",
        segments: ["Объект", "ValueType"],
        source: { kind: "objectField", owner: { kind: "ПланВидовХарактеристик", name: "ВидыСубконто" }, name: "ТипЗначения" },
        typeInfo: { kinds: ["typeDescription"], sourceText: "ПланВидовХарактеристик.ValueType" },
      },
    })
  })

  it("does not allow traversing through ValueType", () => {
    const result = resolve("Объект.ValueType.Code", {
      index: indexWithAttributes([attribute("Объект", { type: ["ChartOfCharacteristicTypesRef.ВидыСубконто"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "ПланВидовХарактеристик", name: "ВидыСубконто" },
          rule: MetadataChartOfCharacteristicTypesRules,
          model: { itemType: "MetadataChartOfCharacteristicTypes" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.ValueType.Code": промежуточный реквизит "ValueType" не является объектом',
        }),
      ],
    })
  })

  it("keeps ValueType scoped to owners with the standard attribute", () => {
    const result = resolve("Объект.ValueType", {
      index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
      ownerCache: ownerCache([owner({ ref: { kind: "Справочник", name: "Номенклатура" } })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.ValueType": неизвестный реквизит "ValueType"',
        }),
      ],
    })
  })

  it("resolves ExchangePlan sent and received numbers as scalar standard attributes", () => {
    const owners = ownerCache([
      owner({
        ref: { kind: "ПланОбмена", name: "Синхронизация" },
        rule: MetadataExchangePlanRules,
        model: { itemType: "MetadataExchangePlan" },
      }),
    ])

    for (const [path, yamlName] of [
      ["Объект.SentNo", "НомерОтправленного"],
      ["Объект.ReceivedNo", "НомерПринятого"],
    ] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["ExchangePlanRef.Синхронизация"] })]),
          ownerCache: owners,
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "objectField", owner: { kind: "ПланОбмена", name: "Синхронизация" }, name: yamlName },
          typeInfo: { kinds: ["scalar"], sourceText: "ПланОбмена.SentReceivedNo" },
        },
      })
    }
  })

  it("does not allow traversing through ExchangePlan sent number", () => {
    const result = resolve("Объект.SentNo.Code", {
      index: indexWithAttributes([attribute("Объект", { type: ["ExchangePlanRef.Синхронизация"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "ПланОбмена", name: "Синхронизация" },
          rule: MetadataExchangePlanRules,
          model: { itemType: "MetadataExchangePlan" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Объект.SentNo.Code": промежуточный реквизит "SentNo" не является объектом',
        }),
      ],
    })
  })

  it("keeps ExchangePlan sent and received numbers scoped to owners with the standard attributes", () => {
    for (const path of ["Объект.SentNo", "Объект.ReceivedNo"] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Объект", { type: ["CatalogRef.Номенклатура"] })]),
          ownerCache: ownerCache([owner({ ref: { kind: "Справочник", name: "Номенклатура" } })]),
        }),
      ).toMatchObject({
        status: "error",
        diagnostics: [
          expect.objectContaining({
            message: `ПутьКДанным "${path}": неизвестный реквизит "${path.split(".").at(-1)}"`,
          }),
        ],
      })
    }
  })

  it("requires a child table DataPath to start with the parent table path", () => {
    const result = resolve("Номенклатура", {
      index: indexWithAttributes([
        attribute("Товары", { type: ["ValueTable"] }, [column("Номенклатура", { type: ["CatalogRef.Номенклатура"] })]),
      ]),
      tableContext: { dataPath: "Товары" },
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Номенклатура": путь колонки должен начинаться с "Товары."',
        }),
      ],
    })
  })

  it("returns a warning for DynamicList fields", () => {
    const result = resolve("Список.Наименование", {
      index: indexWithAttributes([
        { ...attribute("Список", { type: ["CatalogRef.Номенклатура"] }), dynamicList: { itemType: "DynamicList" } },
      ]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message: 'ПутьКДанным "Список.Наименование": колонки динамического списка пока не проверяются',
        }),
      ],
    })
  })

  it("returns a warning for a known platform source", () => {
    const result = resolve("КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Items", {
      index: indexWithAttributes([]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message:
            'ПутьКДанным "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Items": платформенный источник пока не проверяется',
        }),
      ],
    })
  })

  it("returns a warning for a SettingsComposer form attribute data path", () => {
    const result = resolve("КомпоновщикНастроек.Settings.Filter", {
      index: indexWithAttributes([attribute("КомпоновщикНастроек", { type: ["SettingsComposer"] })]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message: 'ПутьКДанным "КомпоновщикНастроек.Settings.Filter": платформенный источник пока не проверяется',
        }),
      ],
    })
  })

  it("returns a warning for a report SettingsComposer object data path", () => {
    const result = resolve("Отчет.SettingsComposer.Settings.Filter.Use", {
      index: indexWithAttributes([attribute("Отчет", { type: ["ReportObject.Анализ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "ОтчетОбъект", name: "Анализ" },
          rule: MetadataReportRules,
          model: { itemType: "MetadataReport" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message:
            'ПутьКДанным "Отчет.SettingsComposer.Settings.Filter.Use": платформенный источник пока не проверяется',
        }),
      ],
    })
  })

  it("returns a warning for indexed SettingsComposer user settings data paths", () => {
    const result = resolve("КомпоновщикНастроек.UserSettings[0].Filter", {
      index: indexWithAttributes([attribute("КомпоновщикНастроек", { type: ["SettingsComposer"] })]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message:
            'ПутьКДанным "КомпоновщикНастроек.UserSettings[0].Filter": платформенный источник пока не проверяется',
        }),
      ],
    })
  })

  it("keeps unsupported intermediate types as errors when the name looks like platform settings", () => {
    const result = resolve("Хранилище.Settings.Filter", {
      index: indexWithAttributes([attribute("Хранилище", { type: ["ValueStorage"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Хранилище.Settings.Filter": промежуточный реквизит "Хранилище" имеет неподдерживаемый тип',
        }),
      ],
    })
  })

  it("resolves StandardPeriod Variant as a scalar field", () => {
    const result = resolve("Период.Variant", {
      index: indexWithAttributes([attribute("Период", { type: ["StandardPeriod"] })]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
      target: {
        value: "Период.Variant",
        source: { kind: "standardPeriodField", name: "Variant" },
        typeInfo: { kinds: ["scalar"], sourceText: "StandardPeriod.Variant" },
      },
    })
  })

  it("resolves StandardPeriod boundary dates as dateTime fields", () => {
    for (const path of ["Период.StartDate", "Период.EndDate"] as const) {
      expect(
        resolve(path, {
          index: indexWithAttributes([attribute("Период", { type: ["StandardPeriod"] })]),
        }),
      ).toMatchObject({
        status: "ok",
        diagnostics: [],
        target: {
          value: path,
          source: { kind: "standardPeriodField", name: path.split(".")[1] },
          typeInfo: { kinds: ["dateTime"], sourceText: `StandardPeriod.${path.split(".")[1]}` },
        },
      })
    }
  })

  it("reports unknown StandardPeriod fields", () => {
    const result = resolve("Период.Unknown", {
      index: indexWithAttributes([attribute("Период", { type: ["StandardPeriod"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Период.Unknown": неизвестный реквизит "Unknown"',
        }),
      ],
    })
  })

  it("keeps unsupported intermediate types as errors when the field looks like StandardPeriod", () => {
    const result = resolve("Хранилище.StartDate", {
      index: indexWithAttributes([attribute("Хранилище", { type: ["ValueStorage"] })]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          message: 'ПутьКДанным "Хранилище.StartDate": промежуточный реквизит "Хранилище" имеет неподдерживаемый тип',
        }),
      ],
    })
  })

  it("returns a warning for Items.*.CurrentData.* paths", () => {
    const result = resolve("Items.Таблица.CurrentData.Номенклатура", {
      index: indexWithAttributes([]),
    })

    expect(result).toMatchObject({
      status: "warning",
      diagnostics: [
        expect.objectContaining({
          severity: "warning",
          source: "structure",
          message: 'ПутьКДанным "Items.Таблица.CurrentData.Номенклатура": CurrentData пока не проверяется',
        }),
      ],
    })
  })

  it("skips tilde variant paths without diagnostics", () => {
    const result = resolve("~Список.Period~Список.Период", {
      index: indexWithAttributes([]),
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
    })
  })

  it("skips tilde variant paths before table context validation", () => {
    const result = resolve("~Список.Period~Список.Период", {
      index: indexWithAttributes([]),
      tableContext: { dataPath: "Список" },
    })

    expect(result).toMatchObject({
      status: "ok",
      diagnostics: [],
    })
  })

  it("reports platform alias as unknown when the owner does not have the standard attribute", () => {
    const result = resolve("Объект.Parent", {
      index: indexWithAttributes([attribute("Объект", { type: ["DocumentRef.Заказ"] })]),
      ownerCache: ownerCache([
        owner({
          ref: { kind: "Документ", name: "Заказ" },
          rule: MetadataDocumentRules,
          model: { itemType: "MetadataDocument" },
        }),
      ]),
    })

    expect(result).toMatchObject({
      status: "error",
      diagnostics: [
        expect.objectContaining({
          source: "structure",
          severity: "error",
          message: 'ПутьКДанным "Объект.Parent": неизвестный реквизит "Parent"',
        }),
      ],
    })
  })
})

function resolve(
  value: string,
  params: {
    index: FormDataPathIndex
    ownerCache?: OwnerMetadataCache
    tableContext?: { dataPath: string }
    yamlPath?: string[]
  },
) {
  const parsed = parseMetadataYaml(`ПутьКДанным: ${JSON.stringify(value)}\n`)

  return resolveDataPath({
    filePath: "/tmp/form.yaml",
    parsed,
    yamlPath: params.yamlPath ?? ["ПутьКДанным"],
    value,
    index: params.index,
    ownerCache: params.ownerCache ?? ownerCache([]),
    ...(params.tableContext ? { tableContext: params.tableContext } : {}),
  })
}

function documentWithGoods(): OwnerMetadataCache {
  return ownerCache([
    owner({
      ref: { kind: "Документ", name: "Заказ" },
      rule: MetadataDocumentRules,
      model: {
        itemType: "MetadataDocument",
        tabularSections: [
          {
            itemType: "MetadataTabularSection",
            name: "Товары",
            attributes: [
              { name: "Номенклатура", type: { type: ["CatalogRef.Номенклатура"] } },
              { name: "Сумма", type: { type: ["decimal"] } },
            ],
          },
        ],
      },
    }),
  ])
}

function documentWithRegisterRecords(): OwnerMetadataCache {
  return ownerCache([
    owner({
      ref: { kind: "Документ", name: "Заказ" },
      rule: MetadataDocumentRules,
      model: {
        itemType: "MetadataDocument",
        registerRecords: ["InformationRegister.Продажи"],
      },
    }),
    owner({
      ref: { kind: "РегистрСведений", name: "Продажи" },
      rule: MetadataInformationRegisterRules,
      model: {
        itemType: "MetadataInformationRegister",
        dimensions: [{ name: "Склад", type: { type: ["CatalogRef.Склады"] } }],
        resources: [{ name: "Количество", type: { type: ["decimal"] } }],
      },
    }),
  ])
}

function reportWithFormOnlyTable(): FormAttribute {
  return {
    ...attribute("Отчет", { type: ["ReportObject.АнализТрансляцииПроводок"] }),
    additionalColumns: [
      {
        table: "Отчет.ТабПравилаВычисленияПараметров",
        columns: [
          column("ПолеБД", { type: ["string"] }),
          column("СпособВычисленияПараметра", { type: ["EnumRef.СпособыВычисленияПараметровОперандов"] }),
        ],
      },
      {
        table: "Отчет.СписокВидовСубконто",
        columns: [
          column("Value", { type: ["string"] }),
          column("Picture", { type: ["Picture"] }),
        ],
      },
    ],
  } as FormAttribute
}

function reportOwnerCache(): OwnerMetadataCache {
  return ownerCache([
    owner({
      ref: { kind: "ОтчетОбъект", name: "АнализТрансляцииПроводок" },
      rule: MetadataReportRules,
      model: {
        itemType: "MetadataReport",
        attributes: [
          { name: "ТабПравилаВычисленияПараметров", type: { type: ["ValueTable"] } },
          { name: "СписокВидовСубконто", type: { type: ["ValueListType"] } },
        ],
      },
    }),
  ])
}

function documentWithAccountingRegisterRecords(): OwnerMetadataCache {
  return ownerCache([
    owner({
      ref: { kind: "Документ", name: "Операция" },
      rule: MetadataDocumentRules,
      model: {
        itemType: "MetadataDocument",
        registerRecords: ["AccountingRegister.Хозрасчетный"],
      },
    }),
    owner({
      ref: { kind: "РегистрБухгалтерии", name: "Хозрасчетный" },
      rule: MetadataAccountingRegisterRules,
      model: {
        itemType: "MetadataAccountingRegister",
        chartOfAccounts: "ChartOfAccounts.Хозрасчетный",
        dimensions: [{ name: "Валюта", type: { type: ["CatalogRef.Валюты"] } }],
        resources: [{ name: "Количество", type: { type: ["decimal"] } }],
      },
    }),
  ])
}

function chartOfAccountsOwners(): OwnerMetadataCache {
  return ownerCache([
    owner({
      ref: { kind: "ПланСчетов", name: "Хозрасчетный" },
      rule: MetadataChartOfAccountsRules,
      model: {
        itemType: "MetadataChartOfAccounts",
        extDimensionTypes: "ChartOfCharacteristicTypes.ВидыСубконтоХозрасчетные",
        extDimensionAccountingFlags: [
          { name: "Суммовой", type: { type: ["boolean"] } },
          { name: "Валютный", type: { type: ["boolean"] } },
        ],
        accountingFlags: [
          { name: "Валютный", type: { type: ["boolean"] } },
        ],
      },
    }),
  ])
}

function chartOfCalculationTypesOwners(): OwnerMetadataCache {
  return ownerCache([
    owner({
      ref: { kind: "ПланВидовРасчета", name: "Начисления" },
      rule: MetadataChartOfCalculationTypesRules,
      model: {
        itemType: "MetadataChartOfCalculationTypes",
      },
    }),
  ])
}

function indexWithAttributes(attributes: FormAttribute[]): FormDataPathIndex {
  return buildFormDataPathIndex({
    filePath: "/tmp/form.yaml",
    parsed: parseMetadataYaml("Реквизиты: {}\n"),
    form: {
      itemType: "ClientApplicationForm",
      attributes,
    } as ClientApplicationForm,
  })
}

function attribute(name: string, type: TypeDescription | undefined, columns: FormAttribute["columns"] = []): FormAttribute {
  return {
    itemType: "FormAttribute",
    name,
    ...(type !== undefined ? { type } : {}),
    columns,
  } as FormAttribute
}

function column(name: string, type: TypeDescription): FormAttribute["columns"][number] {
  return {
    itemType: "FormAttributeColumn",
    name,
    type,
  } as FormAttribute["columns"][number]
}

function ownerCache(owners: OwnerMetadata[]): OwnerMetadataCache {
  const byKey = new Map(owners.map((item) => [ownerKey(item.ref), item]))

  return {
    get(ref): OwnerMetadataResult {
      const found = byKey.get(ownerKey(ref))
      if (found !== undefined) return { status: "ok", owner: found }
      return {
        status: "not-found",
        diagnostics: [
          {
            filePath: "/tmp/Свойства.yaml",
            line: 1,
            col: 1,
            message: "Не найден владелец",
            severity: "error",
            source: "cross-file",
          },
        ],
      }
    },
  }
}

function owner(params: {
  ref?: OwnerMetadata["ref"]
  rule?: MetadataItemRule
  model?: MetadataItem & Record<string, unknown>
}): OwnerMetadata {
  const rule = params.rule ?? MetadataCatalogRules
  const ownerWithoutIndex = {
    ref: params.ref ?? { kind: "Справочник", name: "Номенклатура" },
    filePath: "/tmp/Свойства.yaml",
    model: params.model ?? { itemType: rule.itemType },
    rule,
    spec: {
      kind: "catalog",
      dir: "Справочник",
      rule,
      exportSchema: () => ({ type: "object" }) as never,
      importModel: () => undefined,
    },
  }

  return {
    ...ownerWithoutIndex,
    fieldIndex: buildObjectFieldIndex(ownerWithoutIndex),
  }
}

function ownerKey(ref: OwnerMetadata["ref"]): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
