import { describe, expect, it } from "vitest"
import { xmlExport } from "./exporter"

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
})
