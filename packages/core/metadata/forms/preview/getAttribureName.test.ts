import { describe, expect, it } from "vitest"
import { GetAttributeNameFixture, getAttributeNameFixtures } from "~/tests/fixtures/preview/data"
import { mockСontext } from "~/tests/mockContext"
import { getAttributeName } from "./getAttributeName"

describe("getAttributeName", () => {
  it.each(getAttributeNameFixtures)(
    "should $name",
    ({ attributes, tableDataPath, dataPath, expectedDataPath, expectedAttributes }: GetAttributeNameFixture) => {
      const context = {
        ...mockСontext,
        preview: {
          attributes: attributes,
          prefix: "p_",
        },
      }
      const result = getAttributeName(context, dataPath, tableDataPath)
      expect(result).toEqual(expectedDataPath)
      expect(context.preview?.attributes).toEqual(expectedAttributes)
    }
  )
})
