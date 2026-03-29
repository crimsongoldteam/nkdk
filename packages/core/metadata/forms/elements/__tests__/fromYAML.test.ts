import { describe, expect, it } from "vitest"
import type { CollectableElement } from "~/metadata/orchestration"
import { importElementFromPartialYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { groupedFixtures } from "./fixtures"

describe("importElementFromPartialYAML", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const model = fixture.model as CollectableElement
      const source = (fixture.source ?? fixture.model) as CollectableElement
      const context = fixture.context ?? mockContext

      const result = importElementFromPartialYAML({
        context,
        itemType: model.itemType,
        yaml: fixture.yaml ?? {},
        source,
      })

      expect(result).toEqual(model)
    })
  })
})
