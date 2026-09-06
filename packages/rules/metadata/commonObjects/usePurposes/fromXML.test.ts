import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importUsePurposesFromXML } from "./fromXML"
import { UsePurposesXML } from "./types"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

describe("importUsePurposesFromXML", () => {
  it.each([
    ["<UsePurposes/>", undefined],
    ["<UsePurposes><v8:Value/></UsePurposes>", undefined],
    ['<UsePurposes><v8:Value xsi:type="app:ApplicationUsePurpose">PlatformApplication</v8:Value><v8:Value xsi:type="app:ApplicationUsePurpose">MobilePlatformApplication</v8:Value></UsePurposes>', ["PlatformApplication", "MobilePlatformApplication"]],
  ])("reads structural purposes: %s", (xml, expected) => {
    expect(importUsePurposesFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("should return undefined when xml is undefined", () => {
    const result = importUsePurposesFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single value", () => {
    const xml: UsePurposesXML = {
      "v8:Value": {
        "_xsi:type": "app:ApplicationUsePurpose",
        "#text": "PlatformApplication",
      },
    }

    const result = importUsePurposesFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual(["PlatformApplication"])
  })

  it("should import array of values", () => {
    const xml: UsePurposesXML = {
      "v8:Value": [
        {
          "_xsi:type": "app:ApplicationUsePurpose",
          "#text": "PlatformApplication",
        },
        {
          "_xsi:type": "app:ApplicationUsePurpose",
          "#text": "MobilePlatformApplication",
        },
      ],
    }

    const result = importUsePurposesFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual(["PlatformApplication", "MobilePlatformApplication"])
  })

  it("should return undefined when v8:Value is undefined", () => {
    const xml: UsePurposesXML = {
      "v8:Value": undefined as any,
    }

    const result = importUsePurposesFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toBeUndefined()
  })
})
