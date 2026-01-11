import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "../context/types"
import { getElementId } from "./getElementId"

describe("getElementId", () => {
  it("should return '1' when testMode is true", () => {
    const context: ConfigurationContext = {
      defaultLanguage: "ru",
      testMode: true,
    }

    expect(getElementId(context)).toBe("1")
    expect(getElementId(context)).toBe("1")
  })

  it("should increment counter in normal mode", () => {
    const context: ConfigurationContext = {
      defaultLanguage: "ru",
    }

    expect(getElementId(context)).toBe("1")
    expect(getElementId(context)).toBe("2")
    expect(getElementId(context)).toBe("3")
  })

  it("should continue from existing counter value", () => {
    const context: ConfigurationContext = {
      defaultLanguage: "ru",
      context: {
        elementIdCounter: 5,
      },
    }

    expect(getElementId(context)).toBe("6")
    expect(getElementId(context)).toBe("7")
  })
})
