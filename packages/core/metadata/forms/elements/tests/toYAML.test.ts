import { describe, expect, it } from "vitest"
import type { CollectableElement } from "~/metadata/orchestration"
import { exportElementToPartialYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { groupedFixtures } from "./fixtures"

describe("exportElementToPartialYAML", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const result = exportElementToPartialYAML({
        context: mockContext,
        element: fixture.model as CollectableElement,
      })

      expect(result).toEqual(fixture.yaml)
    })
  })
})
