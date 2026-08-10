import { describe, expect, it } from "vitest"

import {
  composeMetadataRules,
  defineMetadataRules,
} from "."
import { emptyMetadataRules } from "./testSupport"

describe("metadata rules definition", () => {
  it("replaces keyed entries with the later layer and appends ordered entries", () => {
    const firstValidation = () => undefined
    const secondValidation = () => undefined
    const first = defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: { itemType: "First", properties: {} } },
      validation: [{ register: firstValidation }],
    })
    const second = defineMetadataRules({
      ...emptyMetadataRules,
      metadataItems: { Item: { itemType: "Second", properties: {} } },
      validation: [{ register: secondValidation }],
    })

    const result = composeMetadataRules(first, second)

    expect(result.metadataItems.Item?.itemType).toBe("Second")
    expect(result.validation.map(({ register }) => register)).toEqual([
      firstValidation,
      secondValidation,
    ])
  })
})
