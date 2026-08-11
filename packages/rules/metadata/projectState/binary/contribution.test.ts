import { expect, it } from "vitest"
import { createProjectStateFileUpdateBatch } from "../fileUpdate"
import {
  encodeProjectStateImportFinalBatch,
  encodeProjectStateImportIndexBatch,
  encodeProjectStateFileUpdateBatch,
  openProjectStateImportFinalBatch,
  openProjectStateImportIndexBatch,
  openProjectStateFileUpdateBatch,
} from "./contribution"
import { richYamlUpdate } from "./testData"
import type {
  ProjectStateImportFinalFileStateBatch,
  ProjectStateImportIndexContribution,
} from "../importSession"

it("читает сведения файла прямо из переданного ArrayBuffer", () => {
  const encoded = encodeProjectStateFileUpdateBatch(
    createProjectStateFileUpdateBatch([{
      update: richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"),
      hash: 9n,
    }]),
  )
  const view = openProjectStateFileUpdateBatch(encoded)

  expect(view.fileCount).toBe(1)
  expect(view.projectPath(0)).toBe("cf/Товары.yaml")
  expect(view.hash(0)).toBe(9n)
  expect(view.targets(0)).toEqual([{ kind: "object", canonical: "Catalog.Товары" }])
})

it("передаёт владение единственным буфером", () => {
  const encoded = encodeProjectStateFileUpdateBatch(
    createProjectStateFileUpdateBatch([{
      update: richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"),
      hash: 9n,
    }]),
  )

  const received = structuredClone(encoded, { transfer: [encoded.bytes.buffer] })

  expect(encoded.bytes.byteLength).toBe(0)
  expect(openProjectStateFileUpdateBatch(received).projectPath(0)).toBe("cf/Товары.yaml")
})

it.each([
  ["лишнее поле", () => ({ bytes: new Uint8Array(), extra: true })],
  ["SharedArrayBuffer", () => ({ bytes: new Uint8Array(new SharedArrayBuffer(8)) })],
  ["смещённое представление", () => ({ bytes: new Uint8Array(new ArrayBuffer(9), 1, 8) })],
])("отвергает непереносимую границу: %s", (_name, create) => {
  expect(() => openProjectStateFileUpdateBatch(create() as never)).toThrow()
})

it("читает временный индекс import из одного переносимого буфера", () => {
  const contribution = importIndexContribution()
  const encoded = encodeProjectStateImportIndexBatch([contribution])
  const received = structuredClone(encoded, { transfer: [encoded.bytes.buffer] })
  const view = openProjectStateImportIndexBatch(received)

  expect(encoded.bytes.byteLength).toBe(0)
  expect(view.fileCount).toBe(1)
  expect(view.contribution(0)).toEqual(contribution)
})

it("отклоняет старое имя references во временном индексе import", () => {
  const contribution = importIndexContribution()

  expect(() => encodeProjectStateImportIndexBatch([{
    ...contribution,
    targets: undefined,
    references: contribution.targets,
  } as never])).toThrow()
})

function importIndexContribution(): ProjectStateImportIndexContribution {
  return { projectPath: "cf/Товары.yaml", componentPath: "cf", resourceKind: "yaml", yamlRole: "properties",
    targets: [{ kind: "object", canonical: "Catalog.Товары" }], owners: [], fields: [], forms: [] }
}

it("читает окончательное состояние import и хэш из одного переносимого буфера", () => {
  const batch: ProjectStateImportFinalFileStateBatch = {
    updates: [{
      projectPath: "cf/Товары.yaml",
      componentPath: "cf",
      resourceKind: "yaml",
      yamlRole: "properties",
      kind: "yaml",
      localValidation: { contributedFacts: true, diagnostics: [], schemaDiagnostics: [] },
      pendingReferences: [],
      pendingChecks: [],
      dependencies: [],
    }],
    hashBytes: Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 9]),
  }
  const encoded = encodeProjectStateImportFinalBatch(batch)
  const received = structuredClone(encoded, { transfer: [encoded.bytes.buffer] })
  const view = openProjectStateImportFinalBatch(received)

  expect(encoded.bytes.byteLength).toBe(0)
  expect(view.fileCount).toBe(1)
  expect(view.hash(0)).toBe(9n)
  expect(view.finalState(0)).toEqual(batch.updates[0])
})
