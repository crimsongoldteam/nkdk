import { describe, expect, it } from "vitest"
import { parseXmlDocumentWithSaxes } from "../import/saxesParser"
import { xmlExport } from "./exporter"

const XML_ORDERED_CHILDREN = Symbol.for("xmlOrderedChildren")

describe("xmlExport", () => {
  it("groups ChildItems array into one XML node and preserves child order", () => {
    const xml = xmlExport(
      {
        ChildItems: [
          { InputField: { _name: "Input1" } },
          { LabelField: { _name: "Label2" } },
          { InputField: { _name: "Input3" } },
        ],
      },
      false
    )

    expect(xml).toBe(
      [
        "<ChildItems>",
        '\t<InputField name="Input1"/>',
        '\t<LabelField name="Label2"/>',
        '\t<InputField name="Input3"/>',
        "</ChildItems>",
      ].join("\n")
    )
  })

  it("preserves existing ordered children while normalizing export data", () => {
    const xml = xmlExport(
      {
        top: {
          [XML_ORDERED_CHILDREN]: [
            { key: "panel", value: { _id: "first-panel" } },
            { key: "group", value: { _id: "middle-group" } },
            { key: "panel", value: { _id: "last-panel" } },
          ],
        },
      },
      false
    )

    expect(xml).toBe(
      [
        "<top>",
        '\t<panel id="first-panel"/>',
        '\t<group id="middle-group"/>',
        '\t<panel id="last-panel"/>',
        "</top>",
      ].join("\n")
    )
  })

  it("exports structural nodes through the existing ordered XML builder", () => {
    const document = parseXmlDocumentWithSaxes(
      '<Root second="2" first="1"><A>one</A><B/><A>three</A></Root>'
    )

    expect(xmlExport(document.roots, false)).toBe(
      [
        '<Root second="2" first="1">',
        "\t<A>one</A>",
        "\t<B/>",
        "\t<A>three</A>",
        "</Root>",
      ].join("\n")
    )
  })
})
