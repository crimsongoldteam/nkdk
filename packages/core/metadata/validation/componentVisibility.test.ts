import { describe, expect, it } from "vitest"
import { validationComponentLayers } from "./componentVisibility"

describe("validationComponentLayers", () => {
  it("returns only the base layer for the main configuration", () => {
    expect(validationComponentLayers("cf")).toEqual(["cf"])
  })

  it("returns the extension layer before the base layer", () => {
    expect(validationComponentLayers("cfe/Продажи")).toEqual(["cfe/Продажи", "cf"])
  })

  it("rejects an incomplete extension component path", () => {
    expect(() => validationComponentLayers("cfe")).toThrow("Недопустимый validation componentPath")
  })
})
