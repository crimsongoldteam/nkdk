import { describe, expect, it } from "vitest"
import { importContentFromXML } from "@nkdk/runtime"
import { mockContextFromXML } from "../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importIndexFieldsFromXML } from "./fromXML"
import type { IndexFieldsXML } from "./types"

describe("structural index fields", () => {
  it.each([
    ["<Fields/>", undefined],
    ["<Fields><Field/></Fields>", []],
    ["<Fields><Field>А</Field><Field>Б</Field></Fields>", ["А", "Б"]],
    ["<Fields><Field/><Field>Б</Field></Fields>", [undefined, "Б"]],
  ])("preserves %s", (xml, expected) => {
    expect(importIndexFieldsFromXML(mockContextFromXML(), undefined, importContentFromXML<{ Fields?: IndexFieldsXML }>(xml).Fields)).toEqual(expected)
    expect(importIndexFieldsFromXML(mockContextFromXML(), undefined, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })
})
