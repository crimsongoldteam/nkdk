import { describe, expect, it } from "vitest"
import {
  applyReferenceNameMode,
  applyReferenceNameSuffix,
  attachReferenceNameMode,
  attachReferenceNameSuffix,
  getReferenceNameMode,
  getReferenceNameSuffix,
  type SingletonNameStyle,
} from "./singletonName"

const extendedTooltipStyle = {
  canonicalSuffix: "РасширеннаяПодсказка",
  referenceSuffixes: ["РасширеннаяПодсказка", "ExtendedTooltip"],
} as const satisfies SingletonNameStyle

describe("singletonName", () => {
  it("stores suffix mode for a standard reference name relative to owner", () => {
    const reference = attachReferenceNameMode({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СтарыйРодительExtendedTooltip",
      ownerXmlName: "СтарыйРодитель",
      nameStyle: extendedTooltipStyle,
    })

    expect(getReferenceNameMode(reference)).toEqual({ kind: "suffix", suffix: "ExtendedTooltip" })
    expect(Object.keys(reference)).toEqual(["itemType"])
  })

  it("stores exact mode for a noncanonical reference name relative to owner", () => {
    const reference = attachReferenceNameMode({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "ИсторическоеИмяExtendedTooltip",
      ownerXmlName: "СтарыйРодитель",
      nameStyle: extendedTooltipStyle,
    })

    expect(getReferenceNameMode(reference)).toEqual({
      kind: "exact",
      name: "ИсторическоеИмяExtendedTooltip",
    })
    expect(Object.keys(reference)).toEqual(["itemType"])
  })

  it("applies exact reference name before generated suffix replacement", () => {
    const reference = attachReferenceNameMode({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "ИсторическоеИмяExtendedTooltip",
      ownerXmlName: "СтарыйРодитель",
      nameStyle: extendedTooltipStyle,
    })

    const result = applyReferenceNameMode({
      generatedName: "НовыйРодительРасширеннаяПодсказка",
      referenceElement: reference,
      nameStyle: extendedTooltipStyle,
    })

    expect(result).toBe("ИсторическоеИмяExtendedTooltip")
  })

  it("keeps owner rename behavior for standard reference names", () => {
    const reference = attachReferenceNameMode({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СтарыйРодительExtendedTooltip",
      ownerXmlName: "СтарыйРодитель",
      nameStyle: extendedTooltipStyle,
    })

    const result = applyReferenceNameMode({
      generatedName: "НовыйРодительРасширеннаяПодсказка",
      referenceElement: reference,
      nameStyle: extendedTooltipStyle,
    })

    expect(result).toBe("НовыйРодительExtendedTooltip")
  })

  it("stores a known reference suffix as non-enumerable metadata", () => {
    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СписокExtendedTooltip",
      nameStyle: extendedTooltipStyle,
    })

    expect(getReferenceNameSuffix(reference)).toBe("ExtendedTooltip")
    const [referenceNameSuffix] = Object.getOwnPropertySymbols(reference)
    const descriptor = Object.getOwnPropertyDescriptor(reference, referenceNameSuffix)

    expect(descriptor?.enumerable).toBe(false)
    expect(Object.keys(reference)).toEqual(["itemType"])
  })

  it("stores the longest matching reference suffix", () => {
    const overlappingStyle = {
      canonicalSuffix: "Tooltip",
      referenceSuffixes: ["Tooltip", "ExtendedTooltip"],
    } as const satisfies SingletonNameStyle

    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СписокExtendedTooltip",
      nameStyle: overlappingStyle,
    })

    expect(getReferenceNameSuffix(reference)).toBe("ExtendedTooltip")
  })

  it("returns undefined for non-object references", () => {
    expect(getReferenceNameSuffix(undefined)).toBeUndefined()
    expect(getReferenceNameSuffix(null)).toBeUndefined()
    expect(getReferenceNameSuffix("ExtendedTooltip")).toBeUndefined()
    expect(getReferenceNameSuffix(42)).toBeUndefined()
  })

  it("replaces only the canonical suffix and keeps the generated base name", () => {
    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СтарыйРодительExtendedTooltip",
      nameStyle: extendedTooltipStyle,
    })

    const result = applyReferenceNameSuffix({
      generatedName: "НовыйРодительРасширеннаяПодсказка",
      referenceElement: reference,
      nameStyle: extendedTooltipStyle,
    })

    expect(result).toBe("НовыйРодительExtendedTooltip")
  })

  it("keeps the generated name when reference suffix is unknown", () => {
    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СписокUnknownTooltip",
      nameStyle: extendedTooltipStyle,
    })

    const result = applyReferenceNameSuffix({
      generatedName: "СписокРасширеннаяПодсказка",
      referenceElement: reference,
      nameStyle: extendedTooltipStyle,
    })

    expect(getReferenceNameSuffix(reference)).toBeUndefined()
    expect(result).toBe("СписокРасширеннаяПодсказка")
  })

  it("keeps the generated name when the generated name has no canonical suffix", () => {
    const reference = attachReferenceNameSuffix({
      model: { itemType: "ExtendedTooltip" },
      xmlName: "СписокExtendedTooltip",
      nameStyle: extendedTooltipStyle,
    })

    const result = applyReferenceNameSuffix({
      generatedName: "СписокДругоеИмя",
      referenceElement: reference,
      nameStyle: extendedTooltipStyle,
    })

    expect(result).toBe("СписокДругоеИмя")
  })
})
