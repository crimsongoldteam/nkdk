import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { exportMetadataValueToJSONSchema } from "./toJSONSchema"
import { MetadataValueJSONSchema } from "./types"

describe("exportMetadataValueToJSONSchema", () => {
  it("keeps common MetadataValue schema without metadataTarget", () => {
    const schema = exportMetadataValueToJSONSchema({
      context: mockContext,
      rule: { type: "MetadataValue" } as any,
      value: undefined,
    })

    expect(schema).toBe(MetadataValueJSONSchema)
  })

  it("uses metadataTarget value schema when rule defines it", () => {
    const schema = exportMetadataValueToJSONSchema({
      context: mockContext,
      rule: {
        type: "MetadataValue",
        metadataTarget: {
          kind: "value",
          roots: ["Catalog", "Enum"],
          valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
          allowEmptyRef: true,
        },
      } as any,
      value: undefined,
    })

    if (schema === undefined) throw new Error("schema expected")

    expect(schema).toMatchObject({
      type: "string",
      examples: [
        "Справочник.ИмяСправочника.ИмяПредопределенногоЗначения",
        "Перечисление.ИмяПеречисления.ИмяЗначения",
        "Справочник.ИмяСправочника.ПустаяСсылка",
      ],
    })
    expect(String(schema.pattern)).toContain("Справочник")
    expect(String(schema.pattern)).toContain("Перечисление")
    expect(new RegExp(String(schema.pattern)).test("Справочник.СтавкиНДС.ПустаяСсылка")).toBe(true)
    expect(new RegExp(String(schema.pattern)).test("Перечисление.ВидыДоговоров.СПоставщиком")).toBe(true)
  })
})
