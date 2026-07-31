import { describe, expect, it } from "vitest"
import { importContentFromXML } from "../importer"
import { importContentFromXMLWithSaxes } from "./saxesImporter"

const XML_METADATA = Symbol.for("metadata")

const childOrderOf = (value: unknown): unknown =>
  typeof value === "object" && value !== null
    ? (value as Record<PropertyKey, { childOrder?: unknown }>)[XML_METADATA]?.childOrder
    : undefined

const parsers = [
  ["fast-xml-parser", importContentFromXML],
  ["saxes", importContentFromXMLWithSaxes],
] as const

describe.each(parsers)("XML contract: %s", (_name, parse) => {
  it.each([
    ["numeric text", "<Root>2.0</Root>", { Root: "2.0" }],
    ["entity and CDATA", "<Root>A&amp;<![CDATA[B]]>C</Root>", { Root: "A&BC" }],
    ["comment ignored", "<Root>A<!--ignored-->B</Root>", { Root: "AB" }],
    ["empty child dropped", "<Root><Empty/></Root>", { Root: { Empty: undefined } }],
    ["attribute", '<Root id="1">x</Root>', { Root: { _id: "1", "#text": "x" } }],
    ["namespace prefixes", '<xr:Root xr:id="1"/>', { "xr:Root": { "_xr:id": "1" } }],
  ])("%s", (_case, xml, expected) => {
    expect(parse(xml)).toEqual(expected)
  })

  it("сохраняет XML declaration", () => {
    expect(parse(`<?xml version="1.0" encoding="UTF-8"?><Root/>`, { preserveEmptyElements: true })).toEqual({
      "?xml": { _version: "1.0", _encoding: "UTF-8" },
      Root: {},
    })
  })
})

describe("saxes XML contract", () => {
  it("сохраняет порядок разноимённых детей в metadata", () => {
    const xml = "<Root><A>1</A><B>2</B><A>3</A></Root>"
    const parsed = importContentFromXMLWithSaxes<{ Root: { A: string[]; B: string } }>(xml)
    const expected = importContentFromXML<{ Root: unknown }>(xml)

    expect(parsed).toEqual(expected)
    expect(childOrderOf(parsed)).toEqual(childOrderOf(expected))
    expect(childOrderOf(parsed.Root)).toEqual(childOrderOf(expected.Root))
  })

  it("сохраняет ordered-содержимое ChildItems", () => {
    expect(
      importContentFromXMLWithSaxes("<Root><ChildItems><A/><B/><A/></ChildItems></Root>", {
        preserveEmptyElements: true,
      })
    ).toEqual({ Root: { ChildItems: [{ A: {} }, { B: {} }, { A: {} }] } })
  })

  it("применяет настройку preserveXsiNil", () => {
    expect(importContentFromXMLWithSaxes('<Root xsi:nil="true"/>')).toEqual({ Root: undefined })
    expect(importContentFromXMLWithSaxes('<Root xsi:nil="true"/>', { preserveXsiNil: true })).toEqual({
      Root: { "_xsi:nil": "true" },
    })
  })

  it("сохраняет пустой элемент по запросу", () => {
    expect(importContentFromXMLWithSaxes("<Root><Empty/></Root>", { preserveEmptyElements: true })).toEqual({
      Root: { Empty: {} },
    })
  })

  it("преобразует processing instruction в элемент", () => {
    expect(
      importContentFromXMLWithSaxes('<Root><?foo bar="baz"?></Root>', { preserveEmptyElements: true })
    ).toEqual({ Root: { "?foo": { _bar: "baz" } } })
  })

  it("отклоняет имена, небезопасные для объекта", () => {
    expect(() => importContentFromXMLWithSaxes("<Root><__proto__>x</__proto__></Root>")).toThrow()
  })
})
