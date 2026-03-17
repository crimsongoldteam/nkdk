import { describe, expect, it } from "vitest"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"
import { importSystemEnumerationFromXML } from "./fromXML"

describe("importSystemEnumerationFromXML (ScrollBarUse)", () => {
  const rule: SystemEnumerationPropertyRule = {
    type: "SystemEnumeration",
    typeSE: "ScrollBarUse",
  }

  it("возвращает undefined для undefined и null", () => {
    expect(
      importSystemEnumerationFromXML({
        rule,
        xml: undefined,
      })
    ).toBeUndefined()

    expect(
      importSystemEnumerationFromXML({
        rule,
        xml: null,
      })
    ).toBeUndefined()
  })

  it("конвертирует true / 'true' в UseAlways", () => {
    expect(
      importSystemEnumerationFromXML({
        rule,
        xml: true,
      })
    ).toBe("UseAlways")

    expect(
      importSystemEnumerationFromXML({
        rule,
        xml: "true",
      })
    ).toBe("UseAlways")
  })

  it("конвертирует false / 'false' в DontUse", () => {
    expect(
      importSystemEnumerationFromXML({
        rule,
        xml: false,
      })
    ).toBe("DontUse")

    expect(
      importSystemEnumerationFromXML({
        rule,
        xml: "false",
      })
    ).toBe("DontUse")
  })

  it("возвращает undefined для неизвестных значений", () => {
    expect(
      importSystemEnumerationFromXML({
        rule,
        xml: "unknown",
      })
    ).toBeUndefined()

    expect(
      importSystemEnumerationFromXML({
        rule,
        xml: 123,
      })
    ).toBeUndefined()
  })
})

