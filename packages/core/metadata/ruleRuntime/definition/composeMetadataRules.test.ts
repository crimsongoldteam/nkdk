import { describe, expect, it } from "vitest"

import {
  composeMetadataRules,
  defineMetadataRules,
} from "."
import { emptyMetadataRules } from "./testSupport"

describe("metadata rules definition", () => {
  it("replaces keyed entries with the later layer and appends ordered entries", () => {
    const firstValidation = () => []
    const secondValidation = () => []
    const first = defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: { itemType: "First", properties: {} } },
      validation: [
        {
          kind: "localYamlValue",
          propertyType: "first",
          validate: firstValidation,
        },
      ],
    })
    const second = defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: { itemType: "Second", properties: {} } },
      validation: [
        {
          kind: "localYamlValue",
          propertyType: "second",
          validate: secondValidation,
        },
      ],
    })

    const result = composeMetadataRules(first, second)

    expect(result.metadataItems.Item?.itemType).toBe("Second")
    expect(result.validation.map(({ validate }) => validate)).toEqual([
      firstValidation,
      secondValidation,
    ])
  })
})
