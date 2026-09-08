import { describe, expect, it } from "vitest"
import { testPropertyFromXMLToYAML } from "../../../../tests/directConversion"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { parseStructuralXMLWithoutCompatibility } from "../../../../tests/structuralXML"

describe("TableAdditionalSource import", () => {
  it("keeps the source name rather than replacing it with a reference placeholder", () => {
    const { yaml } = testPropertyFromXMLToYAML({
      context: mockContextFromXML(),
      rule: {
        itemType: "AdditionalSourceProbe",
        properties: { source: { type: "TableAdditionalSource", xml: "Source", yaml: "Источник" } },
      },
      xml: parseStructuralXMLWithoutCompatibility("<Root><Source><Item>ТабличнаяЧасть</Item></Source></Root>"),
    })
    expect(yaml).toEqual({ Источник: "ТабличнаяЧасть" })
  })
})
