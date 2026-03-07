import { describe, expect, it } from "vitest"
import { ConfigurationContext, ContextElementToEnterprise } from "~/metadata/context/types"
import { GetAttributeNameFixture, getAttributeNameFixtures } from "~/tests/fixtures/dataPath/data"
import { mockContext } from "~/tests/mockContext"
import { exportDataPathToEnterprise } from "./toEnterprise"

describe("DataPath to Enterprise", () => {
  it.each(getAttributeNameFixtures)(
    "should $name",
    ({ attributes, tableDataPath, dataPath, expectedDataPath, expectedAttributes }: GetAttributeNameFixture) => {
      const elementsTree: ContextElementToEnterprise[] = []
      if (tableDataPath) {
        elementsTree.push({ itemType: "Table", dataPath: tableDataPath })
      }
      elementsTree.push({ itemType: "InputField", dataPath: dataPath })

      const context = {
        ...mockContext,
        enterprise: {
          attributes: attributes,
          prefix: "p_",
          elementsTree: elementsTree,
        },
      } satisfies ConfigurationContext
      const result = exportDataPathToEnterprise({
        context,
        rule: { type: "DataPath", defaultType: "string" },
        value: dataPath,
      })
      expect(result).toEqual(expectedDataPath)
      expect(context.enterprise?.attributes).toEqual(expectedAttributes)
    }
  )
})
