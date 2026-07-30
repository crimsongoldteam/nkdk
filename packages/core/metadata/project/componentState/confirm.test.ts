import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { snapshotConfigurationIndex } from "../../configurationIndex/sharedSnapshot"
import { sampleSnapshot } from "../../configurationIndex/testData"
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
  const snapshot = snapshotConfigurationIndex(
    encodeConfigurationIndex({
      ...sampleSnapshot(),
      files: [],
      entities: [],
    })
  )
  const indexes = {
    componentPath: "cf",
    sourceProjectFiles: projectFiles,
    metadata: {} as ComponentIndexes["metadata"],
    dependencies: [],
    logicalAddresses: [],
  } satisfies ComponentIndexes

  it("rejects hashes for a different structure", () => {
    expect(() =>
      confirmComponentState({
        structure,
        hashes: { componentPath: "cf", projectFiles: [] },
        indexes,
        snapshot,
      })
    ).toThrow("структура и хэши относятся к разному составу файлов")
  })

  it("rejects indexes for another file state", () => {
    expect(() =>
      confirmComponentState({
        structure,
        hashes: { componentPath: "cf", projectFiles },
        indexes: {
          ...indexes,
          sourceProjectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 2n }],
        },
        snapshot,
      })
    ).toThrow("индексы относятся к другому состоянию файлов")
  })

  it("rejects a snapshot bound to another component", () => {
    const data = sampleSnapshot()
    const other = snapshotConfigurationIndex(
      encodeConfigurationIndex({
        ...data,
        componentPath: "cfe/Другое",
      })
    )

    expect(() =>
      confirmComponentState({
        structure,
        hashes: { componentPath: "cf", projectFiles },
        indexes,
        snapshot: other,
      })
    ).toThrow("снимок относится к другому компоненту")
  })

  it("keeps the snapshot separate from current logical addresses", () => {
    const currentIndexes = {
      ...indexes,
      logicalAddresses: [
        {
          logicalAddress: "Справочник.Товары",
          sourceProjectPath: "Конфигурация.yaml",
        },
      ],
    }

    const confirmed = confirmComponentState({
      structure,
      hashes: { componentPath: "cf", projectFiles },
      indexes: currentIndexes,
      snapshot,
    })

    expect(confirmed.indexes).toBe(currentIndexes)
    expect(confirmed.snapshot).toBe(snapshot)
  })
})
