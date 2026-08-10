import { expect, it } from "vitest"
import {
  ProjectStateDiagnosticRecordView,
  ProjectStateDiagnosticSectionHeaderView,
  ProjectStateFactSectionHeaderView,
  ProjectStateFactTableRecordView,
  ProjectStateValidationStatusRecordView,
} from "./layouts"
import {
  assertProjectStateFactSection,
  PROJECT_STATE_FACT_TABLE_IDS,
} from "./factTables"

it("принимает согласованные каталоги фактов и диагностик", () => {
  const { facts, diagnostics } = validSections()

  expect(() => assertProjectStateFactSection({ facts, diagnostics, fileCount: 1, stringCount: 3 }))
    .not.toThrow()
})

it.each([
  ["неизвестный вид таблицы", ({ facts }: ReturnType<typeof validSections>) => {
    new DataView(facts).setUint16(ProjectStateFactSectionHeaderView.viewLength, 0xffff, true)
  }],
  ["выход sourceFileId за число файлов", ({ facts }: ReturnType<typeof validSections>) => {
    const recordOffset = ProjectStateFactSectionHeaderView.viewLength + ProjectStateFactTableRecordView.viewLength
    new DataView(facts).setUint32(recordOffset, 1, true)
  }],
  ["выход строкового id за таблицу строк", ({ diagnostics }: ReturnType<typeof validSections>) => {
    new DataView(diagnostics).setUint32(ProjectStateDiagnosticSectionHeaderView.viewLength + 12, 3, true)
  }],
  ["оборванный диапазон диагностик", ({ facts }: ReturnType<typeof validSections>) => {
    const recordOffset = ProjectStateFactSectionHeaderView.viewLength + ProjectStateFactTableRecordView.viewLength
    new DataView(facts).setUint32(recordOffset + 8, 2, true)
  }],
] as const)("отвергает %s", (_name, corrupt) => {
  const sections = validSections()
  corrupt(sections)

  expect(() => assertProjectStateFactSection({ ...sections, fileCount: 1, stringCount: 3 })).toThrow()
})

function validSections(): { facts: ArrayBuffer; diagnostics: ArrayBuffer } {
  const catalogOffset = ProjectStateFactSectionHeaderView.viewLength
  const recordOffset = catalogOffset + ProjectStateFactTableRecordView.viewLength
  const facts = new ArrayBuffer(recordOffset + ProjectStateValidationStatusRecordView.viewLength)
  const factsView = new DataView(facts)
  ProjectStateFactSectionHeaderView.encode({ tableCount: 1, catalogOffset }, factsView)
  ProjectStateFactTableRecordView.encode({
    kind: PROJECT_STATE_FACT_TABLE_IDS.validationStatus,
    reserved: 0,
    offset: recordOffset,
    records: 1,
    recordByteLength: ProjectStateValidationStatusRecordView.viewLength,
  }, factsView, catalogOffset)
  ProjectStateValidationStatusRecordView.encode({
    sourceFileId: 0,
    contributedFacts: 1,
    reserved8: 0,
    reserved16: 0,
    diagnosticsStart: 0,
    diagnosticsCount: 1,
    schemaDiagnosticsStart: 1,
    schemaDiagnosticsCount: 0,
  }, factsView, recordOffset)

  const diagnostics = new ArrayBuffer(
    ProjectStateDiagnosticSectionHeaderView.viewLength + ProjectStateDiagnosticRecordView.viewLength,
  )
  const diagnosticsView = new DataView(diagnostics)
  ProjectStateDiagnosticSectionHeaderView.encode({
    count: 1,
    recordsOffset: ProjectStateDiagnosticSectionHeaderView.viewLength,
  }, diagnosticsView)
  ProjectStateDiagnosticRecordView.encode({
    sourceFileId: 0,
    line: 1,
    col: 2,
    messageId: 1,
    pathId: 2,
    severity: 1,
    source: 2,
    reserved: 0,
  }, diagnosticsView, ProjectStateDiagnosticSectionHeaderView.viewLength)
  return { facts, diagnostics }
}
