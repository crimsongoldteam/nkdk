import { describe, expect, it } from "vitest"
import {
  catalogTabularAttributeTypeLink,
  catalogTabularAttributeTypeLinkLinkItem0,
  typeLinkYamlCatalogWithLinkItem,
  typeLinkYamlCatalogWithoutLinkItem,
} from "./__fixtures__/data"
import { PropertyRule } from "../../orchestration"
import { testAtomicFromYAML } from "../../../tests/property/atomicFromYAML"

const rule: PropertyRule = {
  type: "TypeLink",
}

describe("import TypeLink from YAML", () => {
  it("imports string without link item", () => {
    const result = testAtomicFromYAML({
      rule,
      value: typeLinkYamlCatalogWithoutLinkItem,
    })

    expect(result).toEqual(catalogTabularAttributeTypeLinkLinkItem0)
  })

  it("imports string with link item", () => {
    const result = testAtomicFromYAML({
      rule,
      value: typeLinkYamlCatalogWithLinkItem,
    })

    expect(result).toEqual(catalogTabularAttributeTypeLink)
  })

  it("returns undefined for undefined value", () => {
    const result = testAtomicFromYAML({
      rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })
})
