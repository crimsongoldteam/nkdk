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

  it.each([
    ["Date", "2026-08-09T00:00:00", "valid"],
    ["Date", "2026-08-09T12:30:00", "invalid"],
    ["Time", "0001-01-01T12:30:59", "valid"],
    ["Time", "2026-08-09T12:30:00", "invalid"],
    ["DateTime", "2026-08-09T12:30:00", "valid"],
    ["DateTime", "2025-02-29T00:00:00", "invalid"],
    ["DateTime", "2024-02-29T00:00:00", "valid"],
    ["DateTime", "2026-13-01T00:00:00", "invalid"],
    ["DateTime", "2026-08-09T24:00:00", "invalid"],
    ["DateTime", "09.08.2026 12:30:00", "invalid"],
  ] as const)("classifies %s %s as %s", (dateFractions, value, expected) => {
    expect(
      classify(
        { type: ["dateTime"], dateQualifiers: { dateFractions } },
        { type: "dateTime", value }
      ).kind
    ).toBe(expected)
  })

  it.each(["Date", "Time", "DateTime"] as const)("makes beginning %s implicit", (dateFractions) => {
    expect(
      classify(
        { type: ["dateTime"], dateQualifiers: { dateFractions } },
        { type: "dateTime", value: "0001-01-01T00:00:00" }
      ).kind
    ).toBe("implicit")
  })

  it("keeps beginning date as a composite branch", () => {
    expect(
      classify(
        { type: ["string", "dateTime"], dateQualifiers: { dateFractions: "Date" } },
        { type: "dateTime", value: "0001-01-01T00:00:00" }
      ).kind
    ).toBe("valid")
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
