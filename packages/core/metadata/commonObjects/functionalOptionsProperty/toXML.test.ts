import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../orchestration"
import { testAtomicToXML } from "../../../tests/property/atomicToXML"
import "./fromXML"
import "./toXML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("exportFunctionalOptionsToXML", () => {
  it("exports empty item as explicit empty XML item", () => {
    const { result } = testAtomicToXML({
      rule,
      value: [""],
      xmlRootTag: "FunctionalOptions",
    })

    expect(result).toBe("<FunctionalOptions>\n\t<Item/>\n</FunctionalOptions>")
  })
})
