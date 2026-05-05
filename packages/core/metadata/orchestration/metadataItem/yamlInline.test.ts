import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import type { MetadataItemRule } from "../property/types"
import { importMetadataItemFromYAML } from "./fromYAML"
import { exportMetadataItemToJSONSchema } from "./toJSONSchema"
import { exportMetadataItemToYAML } from "./toYAML"

const InlineRule = {
  itemType: "InlineTest",
  properties: {
    marker: {
      type: "XMLRoot",
      container: "Root",
      rootAttributes: { _xmlns: "ns" },
      forReferenceOnly: true,
    },
    payload: {
      type: "string",
      yaml: "payload",
      yamlInline: true,
    },
  },
} as unknown as MetadataItemRule

describe("yamlInline flag", () => {
  it("export: значение payload подставляется как значение всего объекта", () => {
    const result = exportMetadataItemToYAML({
      context: mockContext,
      data: { itemType: "InlineTest", payload: "hello", name: "X" } as any,
      rule: InlineRule,
    })
    expect(result).toBe("hello")
  })

  it("import: всё значение YAML кладётся в payload", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: "hello" as any,
      rule: InlineRule,
      name: "X",
    })
    expect(result).toMatchObject({ payload: "hello" })
  })

  it("toJSONSchema: схема = схема payload, а не объект со свойствами", () => {
    const schema = exportMetadataItemToJSONSchema({ context: mockContext, rule: InlineRule })
    expect((schema as any).type).toBe("string")
  })
})
