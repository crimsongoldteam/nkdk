import { describe, expect, it } from "vitest"
import type { MetadataTypedValue } from "../metadataValue/types"
import type { TypeDescription } from "../typeDescription/types"
import { effectiveTypeFromTypeDescription } from "./effectiveType"
import { classifyFillValue } from "./classify"

const classify = (type: TypeDescription, value: MetadataTypedValue) =>
  classifyFillValue({ effectiveType: effectiveTypeFromTypeDescription(type), value })

describe("classifyFillValue", () => {
  const primitiveCases: ReadonlyArray<[TypeDescription, MetadataTypedValue, string]> = [
    [{ type: ["string"] }, { type: "string", value: "текст" }, "valid"],
    [{ type: ["string"] }, { type: "string", value: "" }, "implicit"],
    [{ type: ["string"] }, { type: "decimal", value: 1 }, "invalid"],
    [{ type: ["decimal"] }, { type: "decimal", value: 12 }, "valid"],
    [{ type: ["decimal"] }, { type: "decimal", value: 0 }, "implicit"],
    [{ type: ["decimal"] }, { type: "string", value: "12" }, "invalid"],
    [{ type: ["boolean"] }, { type: "boolean", value: true }, "valid"],
    [{ type: ["boolean"] }, { type: "boolean", value: false }, "implicit"],
  ]

  it.each(primitiveCases)("classifies %j against %j as %s", (type, value, expected) => {
    expect(classify(type, value).kind).toBe(expected)
  })

  it("checks variable and fixed string length", () => {
    expect(
      classify(
        { type: ["string"], stringQualifiers: { length: 3, allowedLength: "Variable" } },
        { type: "string", value: "1234" }
      ).kind
    ).toBe("invalid")
    expect(
      classify(
        { type: ["string"], stringQualifiers: { length: 3, allowedLength: "Fixed" } },
        { type: "string", value: "12" }
      ).kind
    ).toBe("invalid")
  })

  it("validates a single reference and treats its EmptyRef as implicit", () => {
    const type = { type: ["CatalogRef.Контрагенты"] }
    expect(classify(type, { type: "ref", value: "Catalog.Контрагенты.Поставщик" }).kind).toBe(
      "valid"
    )
    expect(classify(type, { type: "ref", value: "Catalog.Контрагенты.EmptyRef" }).kind).toBe("implicit")
    expect(classify(type, { type: "ref", value: "Document.Заказ.EmptyRef" }).kind).toBe("invalid")
  })

  it("allows an unselected or empty selected branch for a composite reference", () => {
    const type = { type: ["CatalogRef.Контрагенты", "CatalogRef.Партнеры"] }
    expect(classify(type, { type: "ref", value: "" }).kind).toBe("valid")
    expect(classify(type, { type: "ref", value: "Catalog.Контрагенты.EmptyRef" }).kind).toBe("valid")
    expect(classify(type, { type: "ref", value: "Document.Заказ.EmptyRef" }).kind).toBe("invalid")
  })

  it("returns unresolved without guessing an implicit value", () => {
    expect(classify({ type: ["UnknownPlatformType"] }, { type: "string", value: "" }).kind).toBe("unresolved")
  })
})
