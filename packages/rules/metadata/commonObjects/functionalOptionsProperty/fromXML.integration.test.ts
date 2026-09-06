import { describe,expect,it } from "vitest"
import { testImportPropertyFromXML } from "../../../tests/property/importPropertyFromXML"
import { PropertyRule } from "../../ruleRuntime"
import "./fromXML"
import { importFunctionalOptionsFromXML } from "./fromXML"
import { mockContextFromXML } from "../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

const rule: PropertyRule = {
  type: "FunctionalOptionsProperty",
  yaml: "ФункциональныеОпции",
}

describe("importFunctionalOptionsFromXML", () => {
  it.each([
    ["<FunctionalOptions/>", undefined],
    ["<FunctionalOptions><Item/></FunctionalOptions>", [""]],
    ["<FunctionalOptions><Item>FunctionalOption.А</Item><Item/><Item>FunctionalOption.А</Item></FunctionalOptions>", ["FunctionalOption.А", "", "FunctionalOption.А"]],
  ])("reads structural options including empty occurrences: %s", (xml, expected) => {
    expect(importFunctionalOptionsFromXML(mockContextFromXML(), rule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("imports empty item as explicit empty string", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: "<FunctionalOptions><Item/></FunctionalOptions>",
      xmlRootTag: "FunctionalOptions",
    })

    expect(result).toEqual([""])
  })
})
