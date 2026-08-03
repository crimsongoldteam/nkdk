import { expect, it } from "vitest"
import { richYamlUpdate } from "./testData"
import type { ProjectStateImportIndexContribution } from "../importSession"
import { ProjectStateOwnerFactRecordView } from "./layouts"
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
  }, 10n)

  const fragment = writer.finish()
  const view = openProjectStateFragment(fragment)

  expect(view.fileCount).toBe(2)
  expect(view.fileRecord(0)).toMatchObject({ hash: 9n, updateKind: 1 })
  expect(view.fileRecord(1)).toMatchObject({ hash: 10n, updateKind: 2 })
  expect(Array.from({ length: view.stringCount }, (_, id) => view.stringValue(id)).filter((value) => value === "cf"))
    .toHaveLength(1)
  expect(view.tableRange("references")?.records).toBe(1)
  expect(view.tableRange("fields")?.records).toBe(3)
  expect(view.tableRange("pendingChecks")?.records).toBe(1)
  expect(view.diagnosticCount).toBe(2)
})

it("передаёт пять буферов фрагмента без копирования", () => {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile({
    kind: "resource",
    projectPath: "cf/a.bin",
    componentPath: "cf",
    resourceKind: "resource",
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
        tabularSections: [{
          name: "Строки",
          attributes: [{ name: "Количество", type: { type: ["decimal"] } }],
          standardAttributes: [{ name: "НомерСтроки" }],
        }],
      },
    }],
  }, 9n)

  const view = openProjectStateFragment(writer.finish())

  expect(view.tableRange("ownerFacts")?.records).toBe(4)
  expect(view.tableRange("ownerFactItems")?.records).toBe(4)
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
    references: [{ kind: "object", canonical: "Catalog.Товары" }],
    owners: [],
    fields: [],
    forms: [],
  }
  indexWriter.appendImportIndex(contribution)

  const indexView = openProjectStateFragment(indexWriter.finish())
  expect(indexView.tableRange("references")?.records).toBe(1)

  const finalWriter = createProjectStateFragmentWriter()
  finalWriter.appendImportFinal({
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
  })

  const finalView = openProjectStateFragment(finalWriter.finish())
  expect(finalView.fileRecord(0).hash).toBe(9n)
  expect(finalView.tableRange("validationStatus")?.records).toBe(1)
  expect(finalView.diagnosticCount).toBe(1)
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
  }, 1n)
  return writer.finish()
}
