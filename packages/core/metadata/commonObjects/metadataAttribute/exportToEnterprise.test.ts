import { describe, expect, it } from "vitest"
import {
  full,
  fullEnterprise,
  short,
  shortEnterprise,
  skipSynonym,
  skipSynonymEnterprise,
} from "~/tests/fixtures/metadataAttribute/data"
import { mockСontext } from "~/tests/mockContext"
import { exportMetadataAttributesToEnterprise } from "./exportToEnterprise"

describe("exportMetadataAttributeToEnterprise", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, full)

    expect(result).toEqual(fullEnterprise)
  })

  // it("should export minimal", () => {
  //   const result = exportMetadataAttributesToEnterprise(mockСontext, minimal)

  //   expect(result).toEqual(minimalEnterprise)
  // })

  it("should export with short format", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, short)

    expect(result).toEqual(shortEnterprise)
  })

  it("should skip synonym if it is equal to name", () => {
    const result = exportMetadataAttributesToEnterprise(mockСontext, skipSynonym)

    expect(result).toEqual(skipSynonymEnterprise)
  })

  // it("should export with short multilanguage format", () => {
  //   const result = exportMetadataAttributesToEnterprise(mockСontext, shortMultilanguage)

  //   expect(result).toEqual(shortMultilanguageEnterprise)
  // })
})
