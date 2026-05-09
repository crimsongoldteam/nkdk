import { describe, expect, it } from "vitest"
import {
  applyReferenceNameSuffix,
  attachReferenceNameSuffix,
  getReferenceNameSuffix,
  type SingletonNameStyle,
} from "./singletonName"

const extendedTooltipStyle = {
  canonicalSuffix: "РасширеннаяПодсказка",
  referenceSuffixes: ["РасширеннаяПодсказка", "ExtendedTooltip"],
} as const satisfies SingletonNameStyle

describe("singletonName", () => {
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
