import { describe, expect, it } from "vitest"
import { validationComponentLayers } from "./componentVisibility"

describe("validationComponentLayers", () => {
  it("returns only the base layer for the main configuration", () => {
    expect(validationComponentLayers("cf")).toEqual(["cf"])
  })

  it("returns only the requested extension layer", () => {
    expect(validationComponentLayers("cfe/Продажи")).toEqual(["cfe/Продажи"])
  })

  it("rejects an incomplete extension component path", () => {
    expect(() => validationComponentLayers("cfe")).toThrow("Недопустимый validation componentPath")
  })
})
