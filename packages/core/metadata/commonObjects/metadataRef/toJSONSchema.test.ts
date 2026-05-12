import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataItemLinkToJSONSchema } from "./toJSONSchema"

describe("exportMetadataItemLinkToJSONSchema", () => {
  it("should export metadata item link JSON schema", () => {
    const result = exportMetadataItemLinkToJSONSchema({ context: mockContext, rule: mockRule, value: undefined })

    expect(result).toMatchObject({ type: "string" })
  })

  it("should register metadata item link JSON schema exporter", () => {
    const exportToJSONSchema = getTypeRule("MetadataItemLink", "exportToJSONSchema")

    const result = exportToJSONSchema?.({ context: mockContext, rule: mockRule, value: undefined })

    expect(result).toMatchObject({ type: "string" })
  })
})
