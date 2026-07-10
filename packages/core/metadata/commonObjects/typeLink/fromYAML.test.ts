import { describe, expect, it } from "vitest"
import {
  catalogTabularAttributeTypeLink,
  catalogTabularAttributeTypeLinkLinkItem0,
  typeLinkYamlCatalogWithLinkItem,
  typeLinkYamlCatalogWithoutLinkItem,
} from "./__fixtures__/data"
import { PropertyRule } from "../../orchestration"
import { testImportPropertyFromYAML } from "../../../tests/property/importPropertyFromYAML"

const rule: PropertyRule = {
  type: "TypeLink",
}

describe("import TypeLink from YAML", () => {
  it("imports string without link item", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: typeLinkYamlCatalogWithoutLinkItem,
    })

    expect(result).toEqual(catalogTabularAttributeTypeLinkLinkItem0)
  })

  it("imports string with link item", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: typeLinkYamlCatalogWithLinkItem,
    })

    expect(result).toEqual(catalogTabularAttributeTypeLink)
  })

  it("returns undefined for undefined value", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })
})
