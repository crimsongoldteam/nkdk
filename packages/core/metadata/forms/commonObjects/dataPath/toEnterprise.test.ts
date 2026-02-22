import { describe, expect, it } from "vitest"
import { GetAttributeNameFixture, getAttributeNameFixtures } from "~/tests/fixtures/dataPath/data"
import { mockContext } from "~/tests/mockContext"
import { exportDataPathToEnterprise } from "./toEnterprise"

describe("DataPath to Enterprise", () => {
  it.each(getAttributeNameFixtures)(
    "should $name",
    ({ attributes, tableDataPath, dataPath, expectedDataPath, expectedAttributes }: GetAttributeNameFixture) => {
      const context = {
        ...mockContext,
        preview: {
          attributes: attributes,
          prefix: "p_",
        },
      }
      const result = exportDataPathToEnterprise({ context, value: dataPath, tableDataPath })
      expect(result).toEqual(expectedDataPath)
      expect(context.preview?.attributes).toEqual(expectedAttributes)
    }
  )
})
