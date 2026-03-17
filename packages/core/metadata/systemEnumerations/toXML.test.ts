import { describe, expect, it } from "vitest"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import { exportSystemEnumerationToXML } from "./toXML"

describe("exportSystemEnumerationToXML (ScrollBarUse)", () => {
  const rule: SystemEnumerationPropertyRule = {
    type: "SystemEnumeration",
    typeSE: "ScrollBarUse",
  }

  it("возвращает undefined для undefined и AutoUse", () => {
    expect(
      exportSystemEnumerationToXML({
        rule,
        value: undefined,
      })
    ).toBeUndefined()

    expect(
      exportSystemEnumerationToXML({
        rule,
        value: "AutoUse",
      })
    ).toBeUndefined()
  })

  it("конвертирует DontUse в false", () => {
    expect(
      exportSystemEnumerationToXML({
        rule,
        value: "DontUse",
      })
    ).toBe(false)
  })

  it("конвертирует UseAlways в true", () => {
    expect(
      exportSystemEnumerationToXML({
        rule,
        value: "UseAlways",
      })
    ).toBe(true)
  })

  it("возвращает undefined для неизвестного значения", () => {
    expect(
      exportSystemEnumerationToXML({
        rule,
        value: "UnknownValue" as unknown as "AutoUse",
      })
    ).toBeUndefined()
  })
})
