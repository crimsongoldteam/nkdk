import { describe, expect, it } from "vitest"
import {
  fullFormAttributes,
  fullFormAttributesEnterprise,
  mainAttributeTitleEqualsName,
  mainAttributeTitleEqualsNameEnterprise,
  shortFormAttribute,
  shortFormAttributeEnterprise,
} from "~/tests/fixtures/formAttributes/data"
import { mockСontext } from "~/tests/mockContext"
import { exportFormAttributesToEnterprise } from "./exportToEnterprise"

describe("exportFormAttributesToEnterprise", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportFormAttributesToEnterprise(mockСontext, fullFormAttributes)

    expect(result).toEqual(fullFormAttributesEnterprise)
  })

  it("should export with short format", () => {
    const result = exportFormAttributesToEnterprise(mockСontext, shortFormAttribute)

    expect(result).toEqual(shortFormAttributeEnterprise)
  })

  it("should export title when mainAttribute=true and title equals name", () => {
    const result = exportFormAttributesToEnterprise(mockСontext, mainAttributeTitleEqualsName)

    expect(result).toEqual(mainAttributeTitleEqualsNameEnterprise)
  })
})
