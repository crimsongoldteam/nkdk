import { describe, expect, it } from "vitest"
import { createProjectValidationGraph } from "./projectValidationGraph"
import type { ComponentValidationLayer } from "./projectValidationTypes"

describe("createProjectValidationGraph", () => {
  it("sorts component layers and rejects duplicate component paths", () => {
    const graph = createProjectValidationGraph([layer("cfe/Склад"), layer("cf"), layer("cfe/Продажи")])

    expect(graph.layers.map(({ componentPath }) => componentPath)).toEqual(["cf", "cfe/Продажи", "cfe/Склад"])
    expect(() => createProjectValidationGraph([layer("cfe/Продажи"), layer("cfe/Продажи")])).toThrow(
      "Повторный validation-слой компонента: cfe/Продажи"
    )
  })

  it("does not retain contribution arrays supplied by the caller", () => {
    const source = layer("cf")
    const graph = createProjectValidationGraph([source])

    source.contribution.objectRecords.push({} as never)
    source.contribution.objectIndexEntries?.push({} as never)
    source.contribution.memberIndexEntries?.push({} as never)
    source.contribution.valueIndexEntries?.push({} as never)
    source.contribution.pendingReferences?.push({} as never)

    expect(graph.layers[0]?.contribution).toMatchObject({
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    })
  })
})

function layer(componentPath: string): ComponentValidationLayer {
  return {
    componentPath,
    contribution: {
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    },
  }
}
