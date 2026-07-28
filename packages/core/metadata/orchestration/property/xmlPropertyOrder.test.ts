import { describe, expect, it } from "vitest"

import type { MetadataItemRule, PropertyRule } from "./types"
import { getCompiledXMLPropertyOrder } from "./xmlPropertyOrder"

describe("getCompiledXMLPropertyOrder", () => {
  it("объединяет xmlOrder с неназванными ключами в порядке объявления", () => {
    const rule = testRule({
      xmlOrder: ["title", "group"],
      properties: {
        name: property(),
        group: property(),
        title: property(),
        unseen: property(),
      },
    })

    expect(getCompiledXMLPropertyOrder(rule)).toEqual(["title", "group", "name", "unseen"])
    expect(getCompiledXMLPropertyOrder(rule)).toBe(getCompiledXMLPropertyOrder(rule))
  })

  it.each([
    { xmlOrder: ["missing"], message: /missing/ },
    { xmlOrder: ["name", "name"], message: /name.*повтор/i },
  ])("отклоняет некорректный xmlOrder $xmlOrder", ({ xmlOrder, message }) => {
    expect(() =>
      getCompiledXMLPropertyOrder(
        testRule({
          xmlOrder,
          properties: { name: property() },
        })
      )
    ).toThrow(message)
  })

  it("принимает readonly tuple", () => {
    const rule = {
      itemType: "Catalog",
      xmlOrder: ["name"] as const,
      properties: { name: property() },
    } satisfies MetadataItemRule

    expect(getCompiledXMLPropertyOrder(rule)).toEqual(["name"])
  })
})

function testRule(params: {
  xmlOrder?: readonly string[]
  properties: Record<string, PropertyRule>
}): MetadataItemRule {
  return {
    itemType: "Catalog",
    xmlOrder: params.xmlOrder,
    properties: params.properties,
  }
}

function property(): PropertyRule {
  return { type: "string" }
}
