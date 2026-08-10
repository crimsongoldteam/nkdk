import { describe, expect, it } from "vitest"
import { effectiveTypeFromTypeDescription } from "./effectiveType"

describe("effectiveTypeFromTypeDescription", () => {
  it("preserves primitive qualifiers", () => {
    expect(
      effectiveTypeFromTypeDescription({
        type: ["string"],
        stringQualifiers: { length: 10, allowedLength: "Fixed" },
      })
    ).toEqual({
      status: "known",
      alternatives: [{ kind: "string", length: 10, allowedLength: "Fixed" }],
      composite: false,
    })
  })

  it("maps concrete reference branches to metadata targets", () => {
    expect(effectiveTypeFromTypeDescription({ type: ["CatalogRef.Контрагенты", "DocumentRef.Заказ"] })).toEqual({
      status: "known",
      alternatives: [
        {
          kind: "reference",
          constraint: {
            kind: "value",
            roots: ["Catalog"],
            valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
            allowEmptyRef: true,
          },
          objectName: "Контрагенты",
        },
        {
          kind: "reference",
          constraint: {
            kind: "value",
            roots: ["Document"],
            valueKinds: ["predefinedValue", "enumValue", "emptyRef"],
            allowEmptyRef: true,
          },
          objectName: "Заказ",
        },
      ],
      composite: true,
    })
  })

  it.each(["Date", "Time", "DateTime"] as const)("maps %s qualifier", (dateFractions) => {
    expect(
      effectiveTypeFromTypeDescription({
        type: ["dateTime"],
        dateQualifiers: { dateFractions },
      })
    ).toEqual({
      status: "known",
      alternatives: [{ kind: "dateTime", dateFractions }],
      composite: false,
    })
  })

  it("defaults dateTime to DateTime", () => {
    expect(effectiveTypeFromTypeDescription({ type: ["dateTime"] })).toEqual({
      status: "known",
      alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }],
      composite: false,
    })
  })

  it("does not guess an unknown type", () => {
    expect(effectiveTypeFromTypeDescription({ type: ["UnknownPlatformType"] })).toMatchObject({
      status: "unresolved",
    })
  })
})
