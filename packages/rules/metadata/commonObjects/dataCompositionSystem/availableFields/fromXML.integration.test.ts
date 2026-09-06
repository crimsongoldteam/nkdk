import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../ruleRuntime"
import { testImportPropertyFromXML } from "../../../../tests/property/importPropertyFromXML"
import { readXMLFixtureAsString } from "../../../../tests/readFixtureXML"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { metadataPropertyRule000 as availableFields } from "./fromXML"
import { fullAvailableFields, selectedItemAvailableFields } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "AvailableFields",
}

describe("import available fields from XML", () => {
  it.each([
    ["full.xml", fullAvailableFields],
    ["selected-item.xml", selectedItemAvailableFields],
  ] as const)("imports %s without compatibility XML", (path, expected) => {
    const result = testImportPropertyFromXML({
      rule,
      path,
      xmlRootTag: "dcsset:selection",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expected)
    const root = parseStructuralXMLWithoutCompatibility(readXMLFixtureAsString(import.meta.url, path))
    expect(availableFields.handler(mockContextFromXML(), rule, root)).toEqual(expected)
  })
})
