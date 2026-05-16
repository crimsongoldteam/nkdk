import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import "./fromXML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("importFunctionalOptionsFromXML", () => {
  it("imports empty item as explicit empty string", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: "<FunctionalOptions><Item/></FunctionalOptions>",
      xmlRootTag: "FunctionalOptions",
    })

    expect(result).toEqual([""])
  })
})
