import { describe, expect, it, vi } from "vitest"
import { readConfirmedComponentIndex } from "./componentProfile"
import type { ConfirmedComponentState } from "../project/componentState/types"

describe("чтение подтверждённого индекса компонента", () => {
  it("ожидает закрытие LMDB и возвращает ошибку закрытия", async () => {
    const closeFailure = new Error("close failed")
    const close = vi.fn(async () => { throw closeFailure })

    await expect(readConfirmedComponentIndex(state(), undefined, () => ({
      getBlocks: () => new Map(),
      close,
    }))).rejects.toBe(closeFailure)
    expect(close).toHaveBeenCalledOnce()
  })
})

function state(): ConfirmedComponentState {
  return {
    structure: {
      address: { kind: "configuration" },
      componentPath: "cf",
      componentDir: "/project/cf",
      projectPaths: [],
      resources: [],
      topology: { rules: [] },
    },
    hashes: { projectFiles: [] },
    indexes: { logicalAddresses: [] },
    snapshot: {
      descriptor: {
        dataPath: "/project/.nkdk/components/cf/configuration-index.lmdb",
        componentKey: "cf",
      },
      projectFiles: [],
    },
    projectStateReadToken: { version: 1, root: "/project", generation: 1 },
  } as unknown as ConfirmedComponentState
}
