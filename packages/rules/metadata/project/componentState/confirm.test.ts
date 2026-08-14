import { describe, expect, it } from "vitest"
import type { ComponentIndexes, ComponentProjectStructure } from "./types"
import { confirmComponentState } from "./confirm"
import { createTestProjectStateReadToken } from "../../projectState/tests/readToken"

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
  const snapshot = {
    descriptor: {
      dataPath: "/project/.nkdk/components/cf/configuration-index.lmdb",
      lockPath: "/project/.nkdk/components/cf/configuration-index.lmdb-lock",
      schemaVersion: 1 as const,
    },
    projectFiles,
  }
  const indexes = {
    componentPath: "cf",
    sourceProjectFiles: projectFiles,
    logicalAddresses: [],
  } satisfies ComponentIndexes
  const projectStateReadToken = createTestProjectStateReadToken()

  it("rejects hashes for a different structure", () => {
    expect(() =>
      confirmComponentState({
        structure,
        hashes: { componentPath: "cf", projectFiles: [] },
        indexes,
        snapshot,
        projectStateReadToken,
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
        projectStateReadToken,
      })
    ).toThrow("индексы относятся к другому состоянию файлов")
  })

  it("keeps the previous snapshot for change detection", () => {
    const other = {
      ...snapshot,
      projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 2n }],
    }

    const confirmed = confirmComponentState({
      structure,
      hashes: { componentPath: "cf", projectFiles },
      indexes,
      snapshot: other,
      projectStateReadToken,
    })

    expect(confirmed.snapshot.projectFiles).toEqual(other.projectFiles)
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
      projectStateReadToken,
    })

    expect(confirmed.indexes).toBe(currentIndexes)
    expect(confirmed.snapshot).toBe(snapshot)
  })
})
