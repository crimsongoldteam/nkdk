import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "../context/types"
import { getElementId } from "./getElementId"

describe("getElementId", () => {
  it("should increment counter in normal mode", () => {
    const context: ConfigurationContext = {
      version: "2.20",
      defaultLanguage: "ru",
    }

    expect(getElementId(context)).toBe("1")
    expect(getElementId(context)).toBe("2")
    expect(getElementId(context)).toBe("3")
  })
})
