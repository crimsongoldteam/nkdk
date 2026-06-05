import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportXDTOTypeNameToJSONSchema } from "./toJSONSchema"

describe("export XDTOTypeName JSON schema", () => {
  it("exports expanded name object schema", () => {
    expect(exportXDTOTypeNameToJSONSchema({ context: mockContext, rule: mockRule, value: undefined })).toMatchObject({
      type: "object",
      required: ["ПространствоИмен", "Имя"],
      properties: {
        ПространствоИмен: { type: "string" },
        Имя: { type: "string" },
      },
    })
  })
})
