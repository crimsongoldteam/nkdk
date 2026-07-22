import { Type } from "typebox"
import { afterEach, describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import {
  getRegisteredProjectSpecByDir,
  registerProjectSpec,
  unregisterProjectSpecForTests,
} from "./projectSpecRegistry"

const SampleRule = testOnlyMetadataItemRule({
  itemType: "SampleItem",
  itemTypePrefix: "Образец",
  xmlDir: "Samples",
  properties: {},
})
const SAMPLE_DIR = "__ТестовыйОбразец__"

function testOnlyMetadataItemRule(rule: {
  itemType: string
  itemTypePrefix: string
  xmlDir: string
  properties: {}
}): MetadataItemRule {
  return rule as unknown as MetadataItemRule
}

describe("projectSpecRegistry", () => {
  afterEach(() => unregisterProjectSpecForTests(SAMPLE_DIR))

  it("registers specs by dir and replaces duplicate registration predictably", () => {
    registerProjectSpec({
      dir: SAMPLE_DIR,
      kind: "sample",
      rule: SampleRule,
      exportSchema: () => Type.Object({ first: Type.String() }),
    })
    registerProjectSpec({
      dir: SAMPLE_DIR,
      kind: "sample2",
      rule: SampleRule,
      exportSchema: () => Type.Object({ second: Type.String() }),
    })

    expect(getRegisteredProjectSpecByDir(SAMPLE_DIR)).toMatchObject({
      dir: SAMPLE_DIR,
      kind: "sample2",
      rule: SampleRule,
    })
  })
})
