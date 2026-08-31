import { describe, expect, it } from "vitest"
import type { MetadataRootName, ParsedMetadataTarget } from "@nkdk/runtime/rule-kit"
import type { ValidationOwnerFacts } from "../validation/dataPath/contracts"
import type { ValidationObjectRecord } from "../validation/projectValidationTypes"
import { collectAppliedObjectDataTables } from "./dataTableRules"

describe("applied object data tables", () => {
  it.each([
    ["FilterCriterion", []],
    ["ExchangePlan", []],
    ["Constant", []],
    ["Catalog", []],
    ["Document", []],
    ["DocumentJournal", []],
    ["Enum", []],
    ["ChartOfCharacteristicTypes", []],
    ["ChartOfAccounts", []],
    ["ChartOfCalculationTypes", []],
    ["InformationRegister", ["SliceFirst", "SliceLast"]],
    ["AccumulationRegister", ["Turnovers"]],
    ["AccountingRegister", ["Balance", "Turnovers", "BalanceAndTurnovers"]],
    ["CalculationRegister", []],
    ["BusinessProcess", ["Points"]],
    ["Task", ["TasksByExecutive"]],
  ] satisfies readonly (readonly [MetadataRootName, readonly string[]])[])(
    "publishes the physical %s table and its unconditional virtual tables",
    (root, virtualTables) => {
      const record = objectRecord(root, "Объект", root === "InformationRegister" ? { periodicity: "Day" } : root === "AccumulationRegister" ? { registerType: "Turnovers" } : {})

      expect(canonicals([record])).toEqual([
        `${root}.Объект`,
        ...virtualTables.map((name) => `${root}.Объект.${name}`),
      ])
    },
  )

  it("publishes information-register slices only for a periodic register", () => {
    expect(canonicals([objectRecord("InformationRegister", "Непериодический", { periodicity: "Nonperiodical" })])).toEqual([
      "InformationRegister.Непериодический",
    ])
  })

  it.each([
    ["Turnovers", ["Turnovers"]],
    ["Balance", ["Balance", "Turnovers", "BalanceAndTurnovers"]],
  ])("publishes accumulation-register virtual tables for %s", (registerType, virtualTables) => {
    expect(canonicals([objectRecord("AccumulationRegister", "Регистр", { registerType })])).toEqual([
      "AccumulationRegister.Регистр",
      ...virtualTables.map((name) => `AccumulationRegister.Регистр.${name}`),
    ])
  })

  it("publishes accounting tables according to correspondence and the chart of accounts", () => {
    const chart = objectRecord("ChartOfAccounts", "План", { maxExtDimensionCount: "3" })
    const register = objectRecord("AccountingRegister", "Регистр", {
      chartOfAccounts: "ChartOfAccounts.План",
      correspondence: "true",
    })

    expect(canonicals([chart, register]).filter((value) => value.startsWith("AccountingRegister"))).toEqual([
      "AccountingRegister.Регистр",
      "AccountingRegister.Регистр.Balance",
      "AccountingRegister.Регистр.Turnovers",
      "AccountingRegister.Регистр.BalanceAndTurnovers",
      "AccountingRegister.Регистр.DrCrTurnovers",
      "AccountingRegister.Регистр.RecordsWithExtDimensions",
      "AccountingRegister.Регистр.ExtDimensions",
    ])
  })

  it("does not publish conditional accounting tables when their conditions are false", () => {
    const chart = objectRecord("ChartOfAccounts", "План", { maxExtDimensionCount: "0" })
    const register = objectRecord("AccountingRegister", "Регистр", {
      chartOfAccounts: "ChartOfAccounts.План",
      correspondence: "false",
    })

    expect(canonicals([chart, register]).filter((value) => value.startsWith("AccountingRegister"))).toEqual([
      "AccountingRegister.Регистр",
      "AccountingRegister.Регистр.Balance",
      "AccountingRegister.Регистр.Turnovers",
      "AccountingRegister.Регистр.BalanceAndTurnovers",
    ])
  })

  it("publishes calculation base, schedule and actual-action-period tables", () => {
    const plan = objectRecord("ChartOfCalculationTypes", "ОсновнойПлан", {
      dependenceOnCalculationTypes: "OnActionPeriod",
      baseCalculationTypes: ["ChartOfCalculationTypes.БазовыйПлан"],
    })
    const [schedule, main] = scheduleDataRecords({
      basePeriod: "true",
      chartOfCalculationTypes: "ChartOfCalculationTypes.ОсновнойПлан",
    })
    const base = objectRecord("CalculationRegister", "Базовый", {
      chartOfCalculationTypes: "ChartOfCalculationTypes.БазовыйПлан",
    })

    expect(canonicals([plan, schedule, main, base]).filter((value) => value.startsWith("CalculationRegister.Основной"))).toEqual([
      "CalculationRegister.Основной",
      "CalculationRegister.Основной.BaseБазовый",
      "CalculationRegister.Основной.ScheduleData",
      "CalculationRegister.Основной.ActualActionPeriod",
    ])
  })

  it.each([
    ["scheduleDate", "InformationRegister.ДругойГрафик.Dimension.Дата"],
    ["scheduleValue", "InformationRegister.ДругойГрафик.Resource.Значение"],
  ])("does not publish schedule data when %s belongs to another register", (property, foreignReference) => {
    const [schedule, main] = scheduleDataRecords({ [property]: foreignReference })

    expect(canonicals([schedule, main])).not.toContain("CalculationRegister.Основной.ScheduleData")
  })

  it("publishes tabular sections as physical tables", () => {
    const record = objectRecord("Catalog", "Товары", {
      tabularSections: [{ name: "Состав", attributes: [] }],
    }, [{ kind: "TabularSection", name: "Состав" }])

    expect(canonicals([record])).toEqual([
      "Catalog.Товары",
      "Catalog.Товары.TabularSection.Состав",
    ])
  })

  it("publishes only nested external data-source tables", () => {
    const source = objectRecord("ExternalDataSource", "Источник")
    const cube = nestedObjectRecord("ExternalDataSource", "Источник", [{ kind: "Cube", objectName: "Куб" }])
    const dimensionTable = nestedObjectRecord("ExternalDataSource", "Источник", [
      { kind: "Cube", objectName: "Куб" },
      { kind: "DimensionTable", objectName: "Измерение" },
    ])
    const table = nestedObjectRecord("ExternalDataSource", "Источник", [{ kind: "Table", objectName: "Таблица" }])

    expect(canonicals([source, cube, dimensionTable, table])).toEqual([
      "ExternalDataSource.Источник.Cube.Куб",
      "ExternalDataSource.Источник.Cube.Куб.DimensionTable.Измерение",
      "ExternalDataSource.Источник.Table.Таблица",
    ])
  })
})

function canonicals(records: readonly ValidationObjectRecord[]): string[] {
  return [...collectAppliedObjectDataTables(records)].map(({ canonical }) => canonical)
}

function scheduleDataRecords(
  overrides: Partial<ValidationOwnerFacts>,
): readonly [ValidationObjectRecord, ValidationObjectRecord] {
  const schedule = objectRecord("InformationRegister", "График", {
    periodicity: "Nonperiodical",
    dimensions: [{ name: "Дата", type: { type: ["dateTime"] } }],
    resources: [{ name: "Значение", type: { type: ["decimal"] } }],
  })
  const register = objectRecord("CalculationRegister", "Основной", {
    actionPeriod: "true",
    schedule: "InformationRegister.График",
    scheduleDate: "InformationRegister.График.Dimension.Дата",
    scheduleValue: "InformationRegister.График.Resource.Значение",
    ...overrides,
  })
  return [schedule, register]
}

function objectRecord(
  root: MetadataRootName,
  name: string,
  facts: Partial<ValidationOwnerFacts> = {},
  tableSegments?: Extract<ParsedMetadataTarget, { kind: "dataTable" }>["tableSegments"],
): ValidationObjectRecord {
  const target = { kind: "object" as const, root, objectName: name }
  return record(target, facts, tableSegments)
}

function nestedObjectRecord(
  root: MetadataRootName,
  name: string,
  segments: NonNullable<Extract<ParsedMetadataTarget, { kind: "object" }>["segments"]>,
): ValidationObjectRecord {
  return record({ kind: "object", root, objectName: name, segments }, {})
}

function record(
  target: Extract<ParsedMetadataTarget, { kind: "object" }>,
  facts: Partial<ValidationOwnerFacts>,
  tableSegments?: Extract<ParsedMetadataTarget, { kind: "dataTable" }>["tableSegments"],
): ValidationObjectRecord {
  const canonical = [
    target.root,
    target.objectName,
    ...(target.segments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
  ].join(".")
  const fieldIndex = { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
  return {
    filePath: `/project/${canonical}.yaml`,
    projectPath: `${canonical}.yaml`,
    kind: "properties",
    owner: { dir: target.root, name: target.objectName },
    ownerFacts: {
      ref: { kind: target.root, name: target.objectName },
      filePath: `/project/${canonical}.yaml`,
      fieldIndex,
      ...facts,
    },
    fieldIndex,
    objectIndexEntries: [{ canonical, target, result: { ok: true } }],
    memberIndexEntries: tableSegments?.map((segment) => ({
      canonical: `${canonical}.${segment.kind}.${segment.name}`,
      target: {
        kind: "member",
        root: target.root,
        objectName: target.objectName,
        objectSegments: target.segments,
        segments: [segment],
      },
      result: { ok: true },
    })),
    importDiagnostics: [],
  }
}
