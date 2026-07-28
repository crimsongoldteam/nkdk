import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import type { ComponentIndexes, ComponentProjectStructure } from "./types"
import { confirmComponentState } from "./confirm"

describe("confirmed component state", () => {
  const projectFiles = [{ projectPath: "Конфигурация.yaml", contentHash: 1n }]
  const structure = {
    address: { kind: "configuration" },
    componentPath: "cf",
    componentDir: "/project/cf",
    topology: {} as ComponentProjectStructure["topology"],
    resources: [],
    projectPaths: ["Конфигурация.yaml"],
  } satisfies ComponentProjectStructure
  const snapshot = snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))
  const indexes = {
    componentPath: "cf",
    sourceProjectFiles: projectFiles,
    metadata: {} as ComponentIndexes["metadata"],
    dependencies: [],
    logicalAddresses: [],
  } satisfies ComponentIndexes

  it("rejects hashes for a different structure", () => {
    expect(() => confirmComponentState({
      structure,
      hashes: { componentPath: "cf", projectFiles: [] },
      indexes,
      snapshot,
    })).toThrow("структура и хэши относятся к разному составу файлов")
  })

  it("rejects indexes for another file state", () => {
    expect(() => confirmComponentState({
      structure,
      hashes: { componentPath: "cf", projectFiles },
      indexes: {
        ...indexes,
        sourceProjectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 2n }],
      },
      snapshot,
    })).toThrow("индексы относятся к другому состоянию файлов")
  })

  it("rejects a snapshot bound to another component", () => {
    const data = sampleIndex()
    const other = snapshotConfigurationIndex(encodeConfigurationIndex({
      ...data,
      binding: { ...data.binding, componentPath: "cfe/Другое" },
    }))

    expect(() => confirmComponentState({
      structure,
      hashes: { componentPath: "cf", projectFiles },
      indexes,
      snapshot: other,
    })).toThrow("снимок относится к другому компоненту")
  })
})
