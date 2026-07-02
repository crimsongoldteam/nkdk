import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "../../orchestration/property/toJSONSchema"
import { mockContext } from "../../../tests/mockContext"
import { MetadataWebServiceOperationRules, MetadataWebServiceParameterRules } from "./rules"
import "../xdtoTypeName/toJSONSchema"

describe("MetadataWebServiceOperation JSON Schema", () => {
  it("exports XDTO type name fields as expanded name objects", () => {
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

    expect(returningTypeSchema).toMatchObject({
      type: "object",
      required: ["ПространствоИмен", "Имя"],
      properties: {
        ПространствоИмен: { type: "string" },
        Имя: { type: "string" },
      },
    })
    expect(parameterTypeSchema).toMatchObject({
      type: "object",
      required: ["ПространствоИмен", "Имя"],
      properties: {
        ПространствоИмен: { type: "string" },
        Имя: { type: "string" },
      },
    })
  })
})
