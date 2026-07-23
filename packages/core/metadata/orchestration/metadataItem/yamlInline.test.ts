import { describe, expect, it } from "vitest"

import { mockContext } from "../../../tests/mockContext"
import type { MetadataItemRule } from "../property/types"
import { exportMetadataItemToJSONSchema } from "./toJSONSchema"

const inlineRule = {
  itemType: "InlineTest",
  properties: {
    marker: {
      type: "XMLRoot",
      container: "Root",
      rootAttributes: { _xmlns: "ns" },
      forReferenceOnly: true,
    },
    payload: { type: "string", yaml: "payload", yamlInline: true },
  },
} as MetadataItemRule

describe("yamlInline flag", () => {
  it("toJSONSchema: схема = схема payload, а не объект со свойствами", () => {
    const schema = exportMetadataItemToJSONSchema({ context: mockContext, rule: inlineRule })

    expect(schema).toMatchObject({ type: "string" })
  })
})
