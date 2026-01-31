import { describe, expect, it } from "vitest"
import { GetAttributeNameFixture, getAttributeNameFixtures } from "~/tests/fixtures/preview/data"
import { mockСontext } from "~/tests/mockContext"
import { getAttributeName } from "./getAttributeName"

describe("getAttributeName", () => {
  it.each(getAttributeNameFixtures)(
    "should return $expected when dataPath is $dataPath",
    ({ attributes, dataPath, expected }: GetAttributeNameFixture) => {
      const context = {
        ...mockСontext,
        preview: {
          attributes: attributes,
          prefix: "prefix",
        },
      }
      const result = getAttributeName(context, dataPath)
      expect(result).toEqual(expected)
    }
  )
})
