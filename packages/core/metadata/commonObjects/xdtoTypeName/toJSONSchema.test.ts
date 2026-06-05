import { describe, expect, it } from "vitest"
import { exportXDTOTypeNameToJSONSchema } from "./toJSONSchema"

describe("export XDTOTypeName JSON schema", () => {
  it("exports expanded name object schema", () => {
    expect(exportXDTOTypeNameToJSONSchema()).toMatchObject({
      type: "object",
      required: ["ПространствоИмен", "Имя"],
      properties: {
        ПространствоИмен: { type: "string" },
        Имя: { type: "string" },
      },
    })
  })
})
