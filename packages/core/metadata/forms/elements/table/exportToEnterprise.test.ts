import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToEnterprise"
import { fullTable, fullTableEnterprise, minimalTable, minimalTableEnterprise } from "~/tests/fixtures/forms/table/data"
import { mockContext } from "~/tests/mockContext"
import { exportElementToPartialYAML } from "~/metadata/metadataFactory"

describe("exportTableToEnterprise", () => {
  describe("exportElementToPartialYAML", () => {
    it("should return undefined when data is undefined", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: undefined })

      expect(result).toBeUndefined()
    })

    it("should export all fields to Enterprise", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: fullTable })

      expect(result).toEqual(fullTableEnterprise)
    })

    it("should export minimal", () => {
      const result = exportElementToPartialYAML({ context: mockContext, element: minimalTable })

      expect(result).toEqual(minimalTableEnterprise)
    })
  })
})
