import { describe, expect, it } from "vitest"
import type { CollectableElement, TypedFormElement } from "~/metadata/orchestration"
import { exportElementToPartialYAML, exportElementToTypedYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { groupedFixtures, groupedTypedFixtures } from "./fixtures"

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

describe("exportElementToTypedYAML", () => {
  describe.each(Object.entries(groupedTypedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const result = exportElementToTypedYAML({
        context: mockContext,
        element: fixture.model as TypedFormElement,
      })

      expect(result).toEqual(fixture.typedYAML)
    })
  })
})
