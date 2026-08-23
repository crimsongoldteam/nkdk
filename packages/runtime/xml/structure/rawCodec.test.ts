import { describe, expect, it } from "vitest"
import { decodeXmlRawValue } from "./rawCodec"

describe("decodeXmlRawValue", () => {
  it("preserves scalar text and distinguishes an absent XML place", () => {
    const scalar = decodeXmlRawValue("01", { elementName: "Value" })
    const absent = decodeXmlRawValue(null, { elementName: "Value" })

    expect(scalar.nodes).toHaveLength(1)
    expect(scalar.nodes[0]).toMatchObject({
      name: "Value",
      path: "/Value[1]",
      content: [{ type: "text", value: "01", path: "/Value[1]/#text[1]" }],
    })
    expect(scalar.suppressOrdinaryOutput).toBe(true)
    expect(absent).toEqual({ nodes: [], suppressOrdinaryOutput: true })
  })

  it("decodes attributes, text, an external name, repeated children and explicit order", () => {
    const fragment = decodeXmlRawValue(
      {
        "#name": "LegacyValue",
        _second: "2",
        _first: "1",
        "#text": "prefix",
        A: ["one", "three"],
        B: { _mode: "new", "#text": "two" },
        "#order": ["A", "B", "A"],
      },
      { elementName: "Value" }
    )

    expect(fragment.nodes[0]).toMatchObject({
      name: "LegacyValue",
      attributes: [
        { name: "second", value: "2" },
        { name: "first", value: "1" },
      ],
      content: [
        { type: "text", value: "prefix" },
        { type: "element", name: "A", content: [{ type: "text", value: "one" }] },
        {
          type: "element",
          name: "B",
          attributes: [{ name: "mode", value: "new" }],
          content: [{ type: "text", value: "two" }],
        },
        { type: "element", name: "A", content: [{ type: "text", value: "three" }] },
      ],
    })
  })

  it.each([
    [1, "строкой"],
    [true, "строкой"],
    [{ _id: 1 }, "атрибута"],
    [{ "#text": false }, "#text"],
    [{ Child: null }, "null"],
    [{ Child: { "#name": "Renamed" } }, "#name"],
    [{ A: ["one", "two"], "#order": ["A"] }, "#order"],
    [{ "?xml": { _version: "1.0" } }, "декларац"],
    [{ "!DOCTYPE": "Root" }, "DOCTYPE"],
  ])("rejects an invalid raw payload %#", (value, expectedMessage) => {
    expect(() => decodeXmlRawValue(value, { elementName: "Value" })).toThrow(
      expectedMessage as string
    )
  })

  it("rejects !xml/raw on a YAML key", () => {
    expect(() =>
      decodeXmlRawValue("value", { elementName: "Value", placement: "key" })
    ).toThrow(/ключ/)
  })
})
