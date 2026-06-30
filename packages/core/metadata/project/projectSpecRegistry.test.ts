import { Type } from "@sinclair/typebox"
import { beforeEach, describe, expect, it } from "vitest"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { clearProjectSpecRegistryForTests, getRegisteredProjectSpecs, registerProjectSpec } from "./projectSpecRegistry"

const SampleRule = {
  itemType: "SampleItem",
  itemTypePrefix: "Образец",
  xmlDir: "Samples",
  properties: {},
} as const satisfies MetadataItemRule

describe("projectSpecRegistry", () => {
  beforeEach(() => clearProjectSpecRegistryForTests())

  it("registers specs by dir and replaces duplicate registration predictably", () => {
    registerProjectSpec({
      dir: "Образец",
      kind: "sample",
      rule: SampleRule,
      exportSchema: () => Type.Object({ first: Type.String() }),
      importModel: ({ name }) => ({ itemType: "SampleItem", name }) as never,
    })
    registerProjectSpec({
      dir: "Образец",
      kind: "sample2",
      rule: SampleRule,
      exportSchema: () => Type.Object({ second: Type.String() }),
      importModel: ({ name }) => ({ itemType: "SampleItem", name }) as never,
    })

    expect(getRegisteredProjectSpecs()).toHaveLength(1)
    expect(getRegisteredProjectSpecs()[0]).toMatchObject({
      dir: "Образец",
      kind: "sample2",
      rule: SampleRule,
    })
  })
})
