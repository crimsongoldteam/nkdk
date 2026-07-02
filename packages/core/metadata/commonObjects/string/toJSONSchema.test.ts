import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { exportStringToJSONSchema } from "./toJSONSchema"

describe("exportStringToJSONSchema", () => {
  it("uses metadataTarget schema when rule describes a metadata target", () => {
    const schema = exportStringToJSONSchema({
      context: mockContext,
      rule: {
        type: "string",
        metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
      },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)

    expect(compiled.Check("ФормаОбъекта")).toBe(true)
    expect(compiled.Check("Справочник.Товары")).toBe(false)
  })
})
