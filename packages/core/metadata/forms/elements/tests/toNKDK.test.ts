import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { groupedFixtures } from "./fixtures"

describe("exportElementToNKDK", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures.filter((f) => f.toNKDKFn && f.nkdk))("$name", (fixture) => {
      const result = fixture.toNKDKFn!({ context: mockContext, element: fixture.model as never })

      expect(result).toEqual(fixture.nkdk)
    })
  })
})
