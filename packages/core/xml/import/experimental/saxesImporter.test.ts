import { describe, expect, it } from "vitest"
import { importContentFromXML } from "../importer"
import { importContentFromXMLWithSaxes } from "./saxesImporter"

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
