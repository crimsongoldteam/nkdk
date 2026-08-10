import { expect, it } from "vitest"
import { fillValuePendingCheck, richYamlUpdate } from "./testData"
import type {
  ProjectStateImportFinalFileStateBatch,
  ProjectStateImportIndexContribution,
} from "../importSession"
import { ProjectStateOwnerFactRecordView } from "./layouts"
import { buildTypedProjectStateSnapshot } from "./typedBuilder"
import { ProjectStateSnapshotView } from "./snapshot"
import { createTypedProjectStateReader } from "./typedReader"
import {
  createProjectStateFragmentWriter,
  openProjectStateFragment,
} from "./fragment"

it("накапливает несколько файлов в одном типизированном фрагменте", () => {
  const writer = createProjectStateFragmentWriter()
  const update = richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
  writer.appendFile(update, 9n)
  writer.appendFile({
    kind: "resource",
    projectPath: "cf/ОбщийМодуль.bsl",
    componentPath: "cf",
    resourceKind: "resource",
    targets: [],
  }, 10n)

  const fragment = writer.finish()
  const view = openProjectStateFragment(fragment)

  expect(view.fileCount).toBe(2)
  expect(view.fileRecord(0)).toMatchObject({ hash: 9n, updateKind: 1 })
  expect(view.fileRecord(1)).toMatchObject({ hash: 10n, updateKind: 2 })
  expect(Array.from({ length: view.stringCount }, (_, id) => view.stringValue(id)).filter((value) => value === "cf"))
    .toHaveLength(1)
  expect(view.tableRange("targets")?.records).toBe(1)
  expect(view.tableRange("fields")?.records).toBe(3)
  expect(view.tableRange("pendingChecks")?.records).toBe(1)
  expect(view.diagnosticCount).toBe(2)
})

it("сохраняет структурные факты документа через fragment и snapshot", () => {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile({
    ...richYamlUpdate("cfe/Расширение/Форма.yaml", "cfe/Расширение", "Catalog.Товары.Form.Форма"),
    structuredDocuments: [{
      documentKind: "clientApplicationForm", representation: "working",
      logicalAddress: "Catalog.Товары.Form.Форма", workingProjectPath: "Форма.yaml",
      componentKind: "element", name: "Поле", yamlPath: ["Элементы", "Поле"], payload: "{\"version\":1}",
    }],
  }, 9n)
  const fragment = openProjectStateFragment(writer.finish())
  const snapshot = new ProjectStateSnapshotView(buildTypedProjectStateSnapshot({ fragments: [fragment], deletions: [] }))

  expect(createTypedProjectStateReader(snapshot).structuredDocuments(0)).toEqual([{
    documentKind: "clientApplicationForm", representation: "working",
    logicalAddress: "Catalog.Товары.Form.Форма", workingProjectPath: "Форма.yaml",
    componentKind: "element", name: "Поле", yamlPath: ["Элементы", "Поле"], payload: "{\"version\":1}",
  }])
})

it("записывает отдельный вид проектной проверки fillValue", () => {
  const writer = createProjectStateFragmentWriter()
  const update = richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
  writer.appendFile({ ...update, pendingChecks: [fillValuePendingCheck()] }, 9n)

  const view = openProjectStateFragment(writer.finish())
  expect(view.tableRange("pendingChecks")?.records).toBe(1)
  expect(Array.from({ length: view.stringCount }, (_, id) => view.stringValue(id))).toContain("fillValue")
})

it("передаёт пять буферов фрагмента без копирования", () => {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile({
    kind: "resource",
    projectPath: "cf/a.bin",
    componentPath: "cf",
    resourceKind: "resource",
    targets: [],
  }, 1n)
  const fragment = writer.finish()
  const transferred = structuredClone(fragment, {
    transfer: Object.values(fragment.buffers),
  })

  expect(Object.values(fragment.buffers).every((buffer) => buffer.byteLength === 0)).toBe(true)
  expect(openProjectStateFragment(transferred).fileCount).toBe(1)
})

it("нормализует составные owner facts в отдельные типизированные таблицы", () => {
  const writer = createProjectStateFragmentWriter()
  const update = richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
  writer.appendFile({
    ...update,
    owners: [{
      owner: { kind: "Catalog", name: "Товары" },
      facts: {
        type: { type: ["string"], stringQualifiers: { length: 20, allowedLength: "Variable" } },
        owners: ["Catalog.Владелец"],
        attributes: [{ name: "Код", type: { type: ["string"] } }],
        enumValues: [{ name: "Высокая" }, { name: "Обычная" }],
        tabularSections: [{
          name: "Строки",
          attributes: [{ name: "Количество", type: { type: ["decimal"] } }],
          standardAttributes: [{ name: "НомерСтроки" }],
        }],
      },
    }],
  }, 9n)

  const view = openProjectStateFragment(writer.finish())

  expect(view.tableRange("ownerFacts")?.records).toBe(5)
  expect(view.tableRange("ownerFactItems")?.records).toBe(6)
  expect(view.tableRange("typeDescriptions")?.records).toBe(3)
  expect(view.tableRange("typeDescriptionValues")?.records).toBe(3)
})

it("собирает оба вида import-фрагментов тем же форматом", () => {
  const indexWriter = createProjectStateFragmentWriter()
  const contribution: ProjectStateImportIndexContribution = {
    projectPath: "cf/Товары.yaml",
    componentPath: "cf",
    resourceKind: "yaml",
    yamlRole: "properties",
    targets: [{ kind: "object", canonical: "Catalog.Товары" }],
    owners: [],
    fields: [],
    forms: [],
  }
  indexWriter.appendImportIndex(contribution)

  const indexView = openProjectStateFragment(indexWriter.finish())
  expect(indexView.tableRange("targets")?.records).toBe(1)

  const finalWriter = createProjectStateFragmentWriter()
  const finalBatch: ProjectStateImportFinalFileStateBatch = {
    updates: [{
      projectPath: contribution.projectPath,
      componentPath: contribution.componentPath,
      resourceKind: "yaml",
      yamlRole: "properties",
      kind: "yaml",
      localValidation: {
        contributedFacts: true,
        diagnostics: [{ line: 1, col: 1, message: "Ошибка", severity: "error", source: "structure" }],
        schemaDiagnostics: [],
      },
      pendingReferences: [],
      pendingChecks: [],
      dependencies: [],
    }],
    hashBytes: Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 9]),
  }
  finalWriter.appendImportFinal(finalBatch)

  const finalView = openProjectStateFragment(finalWriter.finish())
  expect(finalView.fileRecord(0).hash).toBe(9n)
  expect(finalView.tableRange("validationStatus")?.records).toBe(1)
  expect(finalView.diagnosticCount).toBe(1)

  const combinedWriter = createProjectStateFragmentWriter()
  combinedWriter.appendImportIndex(contribution)
  combinedWriter.appendImportFinal(finalBatch)
  const combined = openProjectStateFragment(combinedWriter.finish())
  expect(combined.fileCount).toBe(1)
  expect(combined.tableRange("targets")?.records).toBe(1)
  expect(combined.tableRange("validationStatus")?.records).toBe(1)
})

it.each([
  ["лишнее поле", (fragment: ReturnType<typeof validFragment>) => ({ ...fragment, extra: true })],
  ["SharedArrayBuffer", (fragment: ReturnType<typeof validFragment>) => ({
    buffers: { ...fragment.buffers, header: new SharedArrayBuffer(fragment.buffers.header.byteLength) },
  })],
  ["повреждённую сигнатуру", (fragment: ReturnType<typeof validFragment>) => {
    new DataView(fragment.buffers.header).setUint32(0, 0, true)
    return fragment
  }],
  ["оборванную таблицу файлов", (fragment: ReturnType<typeof validFragment>) => ({
    buffers: { ...fragment.buffers, files: fragment.buffers.files.slice(0, -1) },
  })],
] as const)("отвергает %s", (_name, corrupt) => {
  expect(() => openProjectStateFragment(corrupt(validFragment()) as never)).toThrow()
})

it("отвергает локальную ссылку факта за пределами таблицы строк", () => {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile(richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"), 9n)
  const fragment = writer.finish()
  const fields = openProjectStateFragment(fragment).tableRange("fields")!
  new DataView(fragment.buffers.facts).setUint32(fields.byteOffset + 8, 0xffff_ffff, true)

  expect(() => openProjectStateFragment(fragment)).toThrow(/строк|nameId/iu)
})

it("сохраняет вид пустого owner fact по его предметной роли", () => {
  const writer = createProjectStateFragmentWriter()
  const update = richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары")
  writer.appendFile({
    ...update,
    owners: [{ owner: { kind: "Catalog", name: "Товары" }, facts: { owners: [], attributes: [] } }],
  }, 9n)
  const fragment = writer.finish()
  const range = openProjectStateFragment(fragment).tableRange("ownerFacts")!
  const view = new DataView(fragment.buffers.facts)

  expect(ProjectStateOwnerFactRecordView.decode(view, range.byteOffset).valueKind).toBe(2)
  expect(ProjectStateOwnerFactRecordView.decode(
    view,
    range.byteOffset + ProjectStateOwnerFactRecordView.viewLength,
  ).valueKind).toBe(4)
})

function validFragment() {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile({
    kind: "resource",
    projectPath: "cf/a.bin",
    componentPath: "cf",
    resourceKind: "resource",
    targets: [],
  }, 1n)
  return writer.finish()
}
