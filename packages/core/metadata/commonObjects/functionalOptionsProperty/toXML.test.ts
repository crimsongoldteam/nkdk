import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import "./fromXML"
import "./toXML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("exportFunctionalOptionsToXML", () => {
  it("exports empty item as explicit empty XML item", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: [""],
      xmlRootTag: "FunctionalOptions",
    })

    expect(result).toBe("<FunctionalOptions>\n\t<Item/>\n</FunctionalOptions>")
  })
})
