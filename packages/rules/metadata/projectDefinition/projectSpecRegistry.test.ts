import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { defineProjectSpec } from "./projectSpecRegistry"

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
  it("defines a project spec without legacy registration", () => {
    const definition = defineProjectSpec({
      dir: SAMPLE_DIR,
      kind: "sample",
      rule: SampleRule,
      exportSchema: () => Type.Object({ value: Type.String() }),
    })

    expect(definition.projectSpecs[SAMPLE_DIR]?.rule).toBe(SampleRule)
    expect(definition.schemas.SampleItem?.source).toBe(SampleRule)
  })
})
