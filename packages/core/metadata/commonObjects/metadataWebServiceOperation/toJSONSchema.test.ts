import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import { MetadataWebServiceOperationRules, MetadataWebServiceParameterRules } from "./rules"
import "~/metadata/commonObjects/xdtoTypeName/toJSONSchema"

describe("MetadataWebServiceOperation JSON Schema", () => {
  it("exports XDTO type name fields as strings", () => {
    const returningTypeSchema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: MetadataWebServiceOperationRules.properties.xdtoReturningValueType,
      value: undefined,
    })
    const parameterTypeSchema = exportPropertyToJSONSchema({
      context: mockContext,
      rule: MetadataWebServiceParameterRules.properties.xdtoValueType,
      value: undefined,
    })

    expect(returningTypeSchema).toMatchObject({ type: "string" })
    expect(parameterTypeSchema).toMatchObject({ type: "string" })
  })
})
