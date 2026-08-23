import { expect, it, vi } from "vitest"
import type { ProjectTargetLookup } from "../readSession"
import { ProjectStateReadSessionClosedError } from "../readSession"
import { buildProjectStateSnapshot } from "./builder"
import { createBinaryProjectStateQueryPort, openBinaryProjectStateReadSession } from "./readSession"
import { createProjectStateDependencyValidator } from "../../validation/projectStateDependencyValidation"
import { createBinaryProjectStateReadToken } from "./readToken"
import { ProjectStateSnapshotView } from "./snapshot"
import { addressableRequiredPendingCheck, fillValuePendingCheck, richYamlUpdate } from "./testData"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "./fragment"
import { PROJECT_STATE_FACT_RECORD_VIEWS } from "./factTables"
import {
  createTypedProjectStateReadIndex,
  createTypedProjectStateReader,
} from "./typedReader"

it("соблюдает видимость cf и собственного расширения", () => {
  const session = openSessionWithUpdates([
    richYamlUpdate("cf/base.yaml", "cf", "Catalog.Base"),
    richYamlUpdate("cfe/Цены/own.yaml", "cfe/Цены", "Catalog.Extension"),
    richYamlUpdate("cfe/Скидки/foreign.yaml", "cfe/Скидки", "Catalog.Foreign"),
  ])

  expect(session.resolveTargets([
    lookup("base", "cfe/Цены", "Catalog.Base"),
    lookup("own", "cfe/Цены", "Catalog.Extension"),
    lookup("foreign", "cfe/Цены", "Catalog.Foreign"),
  ]).map(({ status }) => status)).toEqual(["missing", "found", "missing"])
})

it("читает структурные документы только точного компонента и адреса", () => {
  const entry = {
    documentKind: "clientApplicationForm", representation: "working", logicalAddress: "Form.Одна",
    workingProjectPath: "Форма.yaml", componentKind: "element", name: "Поле", yamlPath: ["Элементы", "Поле"],
  } as const
  const session = openSessionWithUpdates([
    { ...richYamlUpdate("cf/form.yaml", "cf", "Form.Одна"), structuredDocuments: [entry] },
    { ...richYamlUpdate("cfe/X/form.yaml", "cfe/X", "Form.Одна"), structuredDocuments: [{ ...entry, name: "Расширение" }] },
  ])

  expect(session.readStructuredDocumentEntries({ componentPath: "cfe/X", logicalAddress: "Form.Одна" }))
    .toEqual([{ ...entry, name: "Расширение" }])
  expect(session.readStructuredDocumentEntries({ componentPath: "cfe/X", logicalAddress: "Form.Другая" })).toEqual([])
})

it("возвращает ambiguous вместо произвольной записи", () => {
  const session = openSessionWithUpdates([
    richYamlUpdate("cf/a.yaml", "cf", "Catalog.Duplicate"),
    richYamlUpdate("cf/b.yaml", "cf", "Catalog.Duplicate"),
  ])

  expect(session.resolveTargets([lookup("duplicate", "cf", "Catalog.Duplicate")]))
    .toEqual([{ requestId: "duplicate", status: "ambiguous" }])
})

it("читает владельца и входы проверки зависимостей из выбранного файла", () => {
  const update = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const session = openSessionWithUpdates([update])
  const owner = { kind: "Справочник", name: "Catalog.Source" }

  expect(session.readOwners([{ requestId: "owner", componentPath: "cf", owner }]))
    .toEqual([{
      requestId: "owner",
      status: "found",
      facts: { registerType: "InformationRegister" },
    }])
  expect(session.readDependencyInputs([{
    requestId: "dependency",
    componentPath: "cf",
    projectPath: update.projectPath,
    check: {
      kind: "dataPath",
      yamlPath: ["ПутьКДанным"],
      location: { line: 1, col: 1 },
      owner,
      value: "Объект.Код",
      tagged: false,
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath",
    },
  }])).toMatchObject([{
    requestId: "dependency",
    status: "found",
    input: {
      owners: [{ owner }],
      fields: [{ name: "Код" }, { name: "Описание" }, { name: "Артикул" }],
      forms: [{ name: "Объект" }],
    },
  }])
})

it("сохраняет декларации табличных элементов с путём и без пути в двоичном снимке", () => {
  const source = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const owner = { kind: "Справочник", name: "Catalog.Source" }
  const update = {
    ...source,
    forms: [
      ...source.forms,
      { kind: "tabularElement" as const, owner, name: "ТаблицаТоваров", dataPath: "Объект.Товары" },
      { kind: "tabularElement" as const, owner, name: "ДеревоГрупп" },
    ],
  }
  const session = openSessionWithUpdates([update])
  const dependencyCheck = source.pendingChecks[0]
  if (dependencyCheck?.kind === "addressableRequired" || dependencyCheck?.kind === "referenceCoverage" || dependencyCheck === undefined) {
    throw new Error("Ожидалась dependency-проверка")
  }

  expect(session.readDependencyInputs([{
    requestId: "dependency",
    componentPath: "cf",
    projectPath: update.projectPath,
    check: dependencyCheck,
  }])).toMatchObject([{
    status: "found",
    input: {
      forms: expect.arrayContaining([{
        kind: "tabularElement",
        owner,
        name: "ТаблицаТоваров",
        dataPath: "Объект.Товары",
      }, {
        kind: "tabularElement",
        owner,
        name: "ДеревоГрупп",
      }]),
    },
  }])
})

it("сохраняет произвольный тип колонки в двоичном снимке", () => {
  const source = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const owner = { kind: "Справочник", name: "Catalog.Source" }
  const arbitrary = {
    kinds: ["any"] as const,
    nextTypes: [],
    terminalTypes: ["<any>"],
    sourceText: "Произвольный",
  }
  const update = {
    ...source,
    forms: [
      {
        kind: "root" as const,
        owner,
        name: "Таблица",
        source: {
          kind: "formAttribute" as const,
          name: "Таблица",
          typeInfo: {
            kinds: ["tableSource"] as const,
            nextTypes: [],
            table: { kind: "ValueTable" as const },
          },
          table: { kind: "ValueTable" as const },
          tableHasColumns: true,
        },
      },
      {
        kind: "additionalColumn" as const,
        owner,
        tablePath: "Таблица",
        name: "Значение",
        source: { name: "Значение", typeInfo: arbitrary },
      },
    ],
  }
  const input = readDependencyInput(update)
  const column = input.forms.find(
    (entry) => entry.kind === "additionalColumn" && entry.tablePath === "Таблица" && entry.name === "Значение"
  )
  expect(column).toMatchObject({ kind: "additionalColumn" })
  if (column?.kind !== "additionalColumn") throw new Error("Не прочитана колонка формы")
  expect(column.source.typeInfo).toEqual(arbitrary)
})

it("сохраняет structuredType реквизита формы в двоичном снимке", () => {
  const source = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const owner = { kind: "Справочник", name: "Catalog.Source" }
  const structured = {
    kinds: ["structured"] as const,
    nextTypes: [],
    terminalTypes: ["DataCompositionSettingsComposer"],
    structuredType: "DataCompositionSettingsComposer",
    sourceText: "КомпоновщикНастроекКомпоновкиДанных",
  }
  const update = {
    ...source,
    forms: [{
      kind: "root" as const,
      owner,
      name: "КомпоновщикНастроек",
      source: {
        kind: "formAttribute" as const,
        name: "КомпоновщикНастроек",
        typeInfo: structured,
      },
    }],
  }
  expect(readDependencyInput(update).forms).toContainEqual({
    kind: "root",
    owner,
    name: "КомпоновщикНастроек",
    source: {
      kind: "formAttribute",
      name: "КомпоновщикНастроек",
      typeInfo: structured,
    },
  })
})

it("находит точные и префиксные metadata-ссылки", () => {
  const update = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const session = openSessionWithUpdates([update])

  expect(session.findReferences([
    { requestId: "exact", componentPath: "cf", canonical: "Catalog.Товары" },
    { requestId: "prefix", componentPath: "cf", canonical: "Catalog", match: "prefix" },
  ])).toEqual([
    {
      requestId: "exact",
      references: [{
        kind: "metadataTarget",
        projectPath: update.projectPath,
        componentPath: "cf",
        yamlPath: ["Ссылка"],
        canonical: "Catalog.Товары",
      }],
    },
    {
      requestId: "prefix",
      references: [{
        kind: "metadataTarget",
        projectPath: update.projectPath,
        componentPath: "cf",
        yamlPath: ["Ссылка"],
        canonical: "Catalog.Товары",
      }],
    },
  ])
})

it("возвращает сохранённые канонические ссылки указанного файла", () => {
  const source = richYamlUpdate("cf/Конфигурация.yaml", "cf", "Configuration.Основная")
  const session = openSessionWithUpdates([{
    ...source,
    pendingReferences: [{
      ...source.pendingReferences[0]!,
      yamlPath: ["ОсновнойЯзык"],
      canonical: "Language.Русский",
    }],
  }])

  expect(session.readFileMetadataTargetReferences([
    { requestId: "root", componentPath: "cf", projectPath: "cf/Конфигурация.yaml" },
    { requestId: "missing", componentPath: "cf", projectPath: "cf/Отсутствует.yaml" },
  ])).toEqual([
    {
      requestId: "root",
      status: "found",
      references: [{ yamlPath: ["ОсновнойЯзык"], canonical: "Language.Русский" }],
    },
    { requestId: "missing", status: "missing" },
  ])
})

it("возвращает страницы целей, владельцев и состояние локальной проверки", () => {
  const session = openSessionWithUpdates([
    richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source"),
  ])

  expect(session.readOwnerRefPage({ componentPath: "cf", kind: "Справочник" }))
    .toEqual({ refs: [{ kind: "Справочник", name: "Catalog.Source" }] })
  expect(session.readComponentTargetPage({ componentPath: "cf" })).toEqual({
    entries: [{ logicalAddress: "Catalog.Source", sourceProjectPath: "cf/source.yaml" }],
  })
  expect(session.readValidationStatus({ offset: 0, batchSize: 1 })).toEqual([{
    projectPath: "cf/source.yaml",
    componentPath: "cf",
    schemaReady: true,
    contributedFacts: true,
  }])
})

it("отвергает запросы после закрытия", () => {
  const session = openSessionWithUpdates([])
  session.close()

  expect(() => session.resolveTargets([])).toThrow(ProjectStateReadSessionClosedError)
})

it("не обращается к прежнему предметному декодированию", () => {
  const buffers = typedSnapshot([richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")])
  const snapshot = new ProjectStateSnapshotView(buffers)
  vi.spyOn(snapshot, "decodeFacts").mockImplementation(() => { throw new Error("старый декодер вызван") })
  const queryPort = createBinaryProjectStateQueryPort(snapshot, {
    dependencyValidator: createProjectStateDependencyValidator(),
  })

  queryPort.resolveTargets([
    lookup("first", "cf", "Catalog.Source"),
    lookup("second", "cf", "Catalog.Source"),
  ])

  expect(queryPort.readValidationStatus({ offset: 0, batchSize: 1 })).toHaveLength(1)
})

it("использует переданный типизированный читатель для всех страниц состояния проверки", () => {
  const buffers = typedSnapshot([
    richYamlUpdate("cf/first.yaml", "cf", "Catalog.First"),
    richYamlUpdate("cf/second.yaml", "cf", "Catalog.Second"),
  ])
  const snapshot = new ProjectStateSnapshotView(buffers)
  const reader = createTypedProjectStateReader(snapshot)
  const localValidation = vi.spyOn(reader, "localValidation")
  const queryPort = createBinaryProjectStateQueryPort(snapshot, {
    typedReader: reader,
    dependencyValidator: createProjectStateDependencyValidator(),
  })

  queryPort.readValidationStatus({ offset: 0, batchSize: 1 })
  queryPort.readValidationStatus({ offset: 1, batchSize: 1 })

  expect(localValidation).toHaveBeenCalledTimes(2)
})

it("читает fillValue-проверку из двоичного состояния без потери payload", () => {
  const expected = fillValuePendingCheck()
  const update = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const snapshot = new ProjectStateSnapshotView(typedSnapshot([{ ...update, pendingChecks: [expected] }]))

  expect(createTypedProjectStateReader(snapshot).pendingChecks(0)).toEqual([expected])
})

it("читает addressableRequired-проверку из двоичного состояния без потери payload", () => {
  const expected = addressableRequiredPendingCheck()
  const update = richYamlUpdate("cfe/X/source.yaml", "cfe/X", "Catalog.Source")
  const snapshot = new ProjectStateSnapshotView(typedSnapshot([{ ...update, pendingChecks: [expected] }]))

  expect(createTypedProjectStateReader(snapshot).pendingChecks(0)).toEqual([expected])
})

it("читает referenceCoverage-проверку из двоичного состояния без потери payload", () => {
  const expected = {
    kind: "referenceCoverage" as const,
    yamlPath: ["Измерения", "Второе"],
    location: { line: 8, col: 5, path: "/Измерения/Второе" },
    requirements: [{
      message: "требуется связь",
      candidates: ["CalculationRegister.Ведущий.Dimension.Ключ"],
      coveredBy: [],
    }],
  }
  const update = richYamlUpdate("cf/source.yaml", "cf", "CalculationRegister.Source")
  const snapshot = new ProjectStateSnapshotView(typedSnapshot([{ ...update, pendingChecks: [expected] }]))

  expect(createTypedProjectStateReader(snapshot).pendingChecks(0)).toEqual([expected])
})

it("читает признак !xml DataPath из существующего reserved-байта", () => {
  const taggedUpdate = richYamlUpdate("cf/tagged.yaml", "cf", "Catalog.Tagged")
  const ordinaryUpdate = {
    ...richYamlUpdate("cf/ordinary.yaml", "cf", "Catalog.Ordinary"),
    pendingChecks: [{
      ...richYamlUpdate("cf/ordinary.yaml", "cf", "Catalog.Ordinary").pendingChecks[0]!,
      tagged: false,
    }],
  }
  const taggedReader = createTypedProjectStateReader(
    new ProjectStateSnapshotView(typedSnapshot([taggedUpdate]))
  )
  const ordinaryReader = createTypedProjectStateReader(
    new ProjectStateSnapshotView(typedSnapshot([ordinaryUpdate]))
  )

  expect(taggedReader.pendingChecks(0)[0]).toMatchObject({
    kind: "dataPath",
    value: "Объект.Код",
    tagged: true,
  })
  expect(ordinaryReader.pendingChecks(0)[0]).toMatchObject({ kind: "dataPath", tagged: false })
})

it("разрешает одинаковую цель один раз для всей серии запросов", () => {
  const buffers = typedSnapshot([
    richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source"),
  ])
  const snapshot = new ProjectStateSnapshotView(buffers)
  const lookupTarget = vi.spyOn(snapshot, "lookupTarget")
  const queryPort = createBinaryProjectStateQueryPort(snapshot, {
    dependencyValidator: createProjectStateDependencyValidator(),
  })

  expect(queryPort.resolveTargets([
    lookup("first", "cf", "Catalog.Source"),
    lookup("second", "cf", "Catalog.Source"),
  ]).map(({ status }) => status)).toEqual(["found", "found"])

  expect(lookupTarget).toHaveBeenCalledTimes(1)
})

it("читает сведения цели без восстановления всех фактов YAML", () => {
  const buffers = typedSnapshot([
    richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source"),
  ])
  const snapshot = new ProjectStateSnapshotView(buffers)
  const reader = createTypedProjectStateReader(snapshot)
  const yamlFacts = vi.spyOn(reader, "yamlFacts")
  const queryPort = createBinaryProjectStateQueryPort(snapshot, {
    typedReader: reader,
    dependencyValidator: createProjectStateDependencyValidator(),
  })

  expect(queryPort.resolveTargets([
    lookup("target", "cf", "Catalog.Source"),
  ])[0]).toMatchObject({ status: "found" })

  expect(yamlFacts).not.toHaveBeenCalled()
})

it("читает входы DataPath без восстановления всех фактов YAML", () => {
  const update = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const snapshot = new ProjectStateSnapshotView(typedSnapshot([update]))
  const reader = createTypedProjectStateReader(snapshot)
  const yamlFacts = vi.spyOn(reader, "yamlFacts")
  const queryPort = createBinaryProjectStateQueryPort(snapshot, {
    typedReader: reader,
    dependencyValidator: createProjectStateDependencyValidator(),
  })

  expect(queryPort.readDependencyInputs([{
    requestId: "dependency",
    componentPath: "cf",
    projectPath: update.projectPath,
    check: {
      kind: "dataPath",
      yamlPath: ["ПутьКДанным"],
      location: { line: 1, col: 1 },
      owner: { kind: "Справочник", name: "Catalog.Source" },
      value: "Объект.Код",
      tagged: false,
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath",
    },
  }])[0]).toMatchObject({ status: "found" })

  expect(yamlFacts).not.toHaveBeenCalled()
})

it("декодирует повторно запрошенную строку снимка один раз", () => {
  const snapshot = new ProjectStateSnapshotView(typedSnapshot([
    richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source"),
  ]))
  const stringId = snapshot.fileRecord(0).projectPathId
  const decode = vi.spyOn(TextDecoder.prototype, "decode")

  expect(snapshot.stringValue(stringId)).toBe("cf/source.yaml")
  expect(snapshot.stringValue(stringId)).toBe("cf/source.yaml")

  expect(decode).toHaveBeenCalledTimes(1)
})

it("переиспользует компактное разбиение строк таблицы между читателями снимка", () => {
  const snapshot = new ProjectStateSnapshotView(typedSnapshot([
    richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source"),
  ]))
  const index = createTypedProjectStateReadIndex(snapshot)
  const decode = vi.spyOn(PROJECT_STATE_FACT_RECORD_VIEWS.validationStatus, "decode")

  createTypedProjectStateReader(snapshot, index).localValidation(0)
  const firstReadCalls = decode.mock.calls.length
  decode.mockClear()
  createTypedProjectStateReader(snapshot, index).localValidation(0)

  expect(decode.mock.calls.length).toBeLessThan(firstReadCalls)
})

it("восстанавливает вложенную цель и !xml отложенной ссылки без повторного разбора ограничения", () => {
  const update = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const pendingReference = {
    yamlPath: ["Форма", "Источник"],
    canonical: "ExternalDataSource.ВнешнийИсточник.Table.Таблица",
    target: {
      kind: "object" as const,
      root: "ExternalDataSource" as const,
      objectName: "ВнешнийИсточник",
      segments: [{ kind: "Table" as const, objectName: "Таблица" }],
    },
    constraint: {
      kind: "member" as const,
      owner: "explicit" as const,
      allowedObjectPaths: [["ExternalDataSource", "Table"]] as const,
      allowOwner: true,
    },
    tagged: "xml" as const,
    propertyStateMode: "notify" as const,
  }
  const buffers = typedSnapshot([{ ...update, pendingReferences: [pendingReference] }])
  const reader = createTypedProjectStateReader(new ProjectStateSnapshotView(buffers))

  expect(reader.pendingReferences(0)).toEqual([pendingReference])
})

it("восстанавливает цели таблицы и её локального поля", () => {
  const update = richYamlUpdate("cf/source.yaml", "cf", "Task.Задачи")
  const references = [
    {
      yamlPath: ["ОсновнаяТаблица"],
      canonical: "AccumulationRegister.Остатки.Balance",
      target: {
        kind: "dataTable" as const,
        root: "AccumulationRegister" as const,
        objectName: "Остатки",
        virtualTable: "Balance",
      },
      constraint: { kind: "dataTable" as const, roots: ["AccumulationRegister" as const] },
    },
    {
      yamlPath: ["ДополнительныеИндексы", 0, "ИндексируемыеПоля", 0],
      canonical: "Date",
      target: { kind: "dataTableField" as const, fieldName: "Date" },
      constraint: { kind: "dataTableField" as const, tableProperty: "table" },
    },
  ]
  const buffers = typedSnapshot([{ ...update, pendingReferences: references }])
  const reader = createTypedProjectStateReader(new ProjectStateSnapshotView(buffers))

  expect(reader.pendingReferences(0)).toEqual(references)
})

function openSessionWithUpdates(updates: ReturnType<typeof richYamlUpdate>[]) {
  const buffers = typedSnapshot(updates)
  return openBinaryProjectStateReadSession(
    createBinaryProjectStateReadToken(buffers),
    createProjectStateDependencyValidator(),
  )
}

function readDependencyInput(update: ReturnType<typeof richYamlUpdate>) {
  const dependencyCheck = update.pendingChecks[0]
  if (dependencyCheck?.kind === "addressableRequired" || dependencyCheck?.kind === "referenceCoverage" || dependencyCheck === undefined) {
    throw new Error("Ожидалась dependency-проверка")
  }
  const response = openSessionWithUpdates([update]).readDependencyInputs([{
    requestId: "dependency",
    componentPath: "cf",
    projectPath: update.projectPath,
    check: dependencyCheck,
  }])[0]
  expect(response).toMatchObject({ status: "found" })
  if (response?.status !== "found") throw new Error("Не прочитаны входы проверки зависимостей")
  return response.input
}

function typedSnapshot(updates: ReturnType<typeof richYamlUpdate>[]) {
  const writer = createProjectStateFragmentWriter()
  updates.forEach((update, index) => writer.appendFile(update, BigInt(index + 1)))
  return buildProjectStateSnapshot({ fragments: [openProjectStateFragment(writer.finish())], deletions: [] })
}

function lookup(
  requestId: string,
  componentPath: string,
  canonicalTarget: string,
): ProjectTargetLookup {
  return { requestId, componentPath, canonicalTarget }
}
