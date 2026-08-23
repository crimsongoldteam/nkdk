import { describe, expect, it } from "vitest"
import { classifyObservedValue, normalizeEffectiveType } from "./valueClassification"

describe("классификация FillValue для каталога", () => {
  it.each([
    ["0001-01-01T00:00:00", "initial"],
    ["2026-08-23T10:20:30", "explicit"],
  ] as const)("относит дату %s к категории %s", (text, category) => {
    const effectiveType = {
      status: "known",
      composite: false,
      alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }],
    } as const

    expect(classifyObservedValue({
      raw: { form: "typedText", xsiType: "xs:dateTime", text },
      typedValue: { type: "dateTime", value: text },
      effectiveType,
    })).toBe(category)
  })

  it.each([
    ["Catalog.Контрагенты.EmptyRef", "xr:DesignTimeRef", "emptyRef"],
    ["Catalog.Контрагенты.Основной", "xr:DesignTimeRef", "predefinedRef"],
    ["Enum.ВидКонтрагента.EnumValue.Покупатель", "xr:DesignTimeRef", "enumValue"],
    ["Catalog.Контрагенты.Object.123", "cfg:CatalogRef.Контрагенты", "concreteRef"],
  ] as const)("относит ссылку %s с xsi:type %s к категории %s", (value, xsiType, category) => {
    expect(classifyObservedValue({
      raw: { form: "typedText", xsiType, text: value },
      typedValue: { type: "ref", value },
      effectiveType: { status: "notSpecified" },
    })).toBe(category)
  })

  it("помечает значение другого типа независимо от policy rules", () => {
    expect(classifyObservedValue({
      raw: { form: "typedText", xsiType: "xs:boolean", text: "false" },
      typedValue: { type: "boolean", value: false },
      effectiveType: {
        status: "known",
        composite: false,
        alternatives: [{
          kind: "reference",
          constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["emptyRef"], allowEmptyRef: true },
          objectName: "Контрагенты",
        }],
      },
    })).toBe("invalid")
  })

  it("строит устойчивую сигнатуру составного типа", () => {
    expect(normalizeEffectiveType({
      status: "known",
      composite: true,
      alternatives: [
        { kind: "reference", constraint: { kind: "value", roots: ["Catalog"], valueKinds: ["emptyRef"], allowEmptyRef: true }, objectName: "Контрагенты" },
        { kind: "string", length: 50, allowedLength: "Variable" },
      ],
    }, "xml")).toEqual({
      source: "xml",
      family: "composite",
      signature: "composite(reference(Catalog.Контрагенты)|string(length=50,allowedLength=Variable))",
      alternatives: [
        { kind: "reference", roots: ["Catalog"], objectName: "Контрагенты" },
        { kind: "string", length: 50, allowedLength: "Variable" },
      ],
    })
  })
})
