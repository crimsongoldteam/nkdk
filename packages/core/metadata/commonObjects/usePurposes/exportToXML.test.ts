import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { exportUsePurposesToXML } from "./exportToXML"

describe("exportUsePurposesToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportUsePurposesToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportUsePurposesToXML(mockContext, [])

    expect(result).toBeUndefined()
  })

  it("should export single value", () => {
    const result = exportUsePurposesToXML(mockContext, ["PlatformApplication"])

    expect(result).toEqual({
      "v8:Value": {
        "_xsi:type": "app:ApplicationUsePurpose",
        "#text": "PlatformApplication",
      },
    })
  })

  it("should export array of values", () => {
    const result = exportUsePurposesToXML(mockContext, ["PlatformApplication", "MobilePlatformApplication"])

    expect(result).toEqual({
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
    })
  })
})
