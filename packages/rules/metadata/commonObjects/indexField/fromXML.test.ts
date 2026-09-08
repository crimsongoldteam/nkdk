import { describe, expect, it } from "vitest"
import { mockContextFromXML } from "../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importIndexFieldsFromXML } from "./fromXML"

describe("structural index fields", () => {
  it.each([
    ["<Fields/>", undefined],
    ["<Fields><Field/></Fields>", []],
    ["<Fields><Field>А</Field><Field>Б</Field></Fields>", ["А", "Б"]],
    ["<Fields><Field/><Field>Б</Field></Fields>", [undefined, "Б"]],
  ])("preserves %s", (xml, expected) => {
    expect(importIndexFieldsFromXML(mockContextFromXML(), undefined, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })
})
