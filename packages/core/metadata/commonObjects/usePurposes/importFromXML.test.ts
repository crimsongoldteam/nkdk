import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { importUsePurposesFromXML } from "./importFromXML"
import { UsePurposesXML } from "./types"

describe("importUsePurposesFromXML", () => {
  it("should return undefined when xml is undefined", () => {
    const result = importUsePurposesFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single value", () => {
    const xml: UsePurposesXML = {
      "v8:Value": {
        "_xsi:type": "app:ApplicationUsePurpose",
        "#text": "PlatformApplication",
      },
    }

    const result = importUsePurposesFromXML(mockСontext, xml)

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

    const result = importUsePurposesFromXML(mockСontext, xml)

    expect(result).toEqual(["PlatformApplication", "MobilePlatformApplication"])
  })

  it("should return undefined when v8:Value is undefined", () => {
    const xml: UsePurposesXML = {
      "v8:Value": undefined as any,
    }

    const result = importUsePurposesFromXML(mockСontext, xml)

    expect(result).toBeUndefined()
  })
})
