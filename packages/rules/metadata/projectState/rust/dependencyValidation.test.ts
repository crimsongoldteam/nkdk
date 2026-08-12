import { openDiagnosticBatch } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { createProjectStateDependencyValidator } from "../../validation/projectStateDependencyValidation"
import { claimBinaryProjectStateReadToken } from "../binary/readToken"
import { createBinaryProjectStateStore } from "../binary/store"
import {
  validateSnapshotDependencyDiagnostics,
} from "../binary/diagnosticBatches"
import { ProjectStateSnapshotView } from "../binary/snapshot"
import { createProjectStateFragmentWriter } from "../binary/fragment"
import { richYamlUpdate } from "../binary/testData"
import { openRustProjectStateReader, projectStateSectionViews } from "./addon"
import { validateRustDependencyDiagnosticBatches } from "./dependencyValidation"

describe("Rust dependency validation pages", () => {
  it("сохраняет диагностики и раскрывает не больше одной страницы проверок", () => {
    const validator = createProjectStateDependencyValidator({
      structuredDocumentValidators: [({ facts }) => facts.map(({ projectPath }) => ({
        filePath: `/project/${projectPath}`,
        line: 1,
        col: 1,
        severity: "warning" as const,
        source: "cross-file" as const,
        message: "Проверен структурный документ",
      }))],
    })
    const store = publishedStore(validator)
    const buffers = claimBinaryProjectStateReadToken(store.createReadToken())
    const snapshot = new ProjectStateSnapshotView(buffers)
    const native = openRustProjectStateReader(projectStateSectionViews(buffers))
    const decodedRows: number[] = []

    const batches = validateRustDependencyDiagnosticBatches({
      native,
      snapshot,
      projectDir: "/project",
      dependencyValidator: validator,
      pageSize: 2,
      onPage: ({ deferredRows }) => decodedRows.push(deferredRows),
    })

    expect(readBatches(batches)).toEqual(
      validateSnapshotDependencyDiagnostics(snapshot, "/project", validator),
    )
    expect(Math.max(...decodedRows)).toBe(2)
    native.close()
    store.close()
  })

  it("сохраняет проектные пути деградационных диагностик", () => {
    const validator = createProjectStateDependencyValidator()
    const { store } = createBinaryProjectStateStore({ projectDir: "/project", dependencyValidator: validator })
    const writer = createProjectStateFragmentWriter()
    writer.appendFile(richYamlUpdate(
      "cfe/demo/Конфигурация.yaml",
      "cfe/demo",
      "Configuration.demo",
    ), 1n)
    store.beginUpdate()
    store.appendFragment(writer.finish())
    store.commitUpdate()
    const buffers = claimBinaryProjectStateReadToken(store.createReadToken())
    const snapshot = new ProjectStateSnapshotView(buffers)
    const native = openRustProjectStateReader(projectStateSectionViews(buffers))

    const actual = readBatches(validateRustDependencyDiagnosticBatches({
      native,
      snapshot,
      projectDir: "/project",
      dependencyValidator: validator,
    }))

    expect(actual).toEqual(validateSnapshotDependencyDiagnostics(snapshot, "/project", validator))
    native.close()
    store.close()
  })
})

function publishedStore(
  dependencyValidator: ReturnType<typeof createProjectStateDependencyValidator>,
) {
  const { store } = createBinaryProjectStateStore({ projectDir: "/project", dependencyValidator })
  const writer = createProjectStateFragmentWriter()
  const configuration = richYamlUpdate("cf/Конфигурация.yaml", "cf", "Configuration.cf")
  writer.appendFile({
    ...configuration,
    structuredDocuments: [{
      documentKind: "clientApplicationForm",
      representation: "working",
      logicalAddress: "Form.Одна",
      workingProjectPath: "Форма.yaml",
      componentKind: "element",
      name: "Поле",
      yamlPath: ["Элементы", "Поле"],
    }],
  }, 1n)
  writer.appendFile(richYamlUpdate("cf/Товары.yaml", "cf", "Catalog.Товары"), 2n)
  store.beginUpdate()
  store.appendFragment(writer.finish())
  store.commitUpdate()
  return store
}

function readBatches(
  batches: readonly { readonly bytes: Uint8Array<ArrayBuffer> }[],
) {
  return batches.flatMap((batch) => {
    const view = openDiagnosticBatch(batch)
    return Array.from({ length: view.count }, (_, index) => view.diagnostic(index))
  })
}
