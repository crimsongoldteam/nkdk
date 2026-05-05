import { describe, expect, it } from "vitest"
import type { CollectableElement } from "~/metadata/orchestration"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { groupedFixtures, groupedTypedFixtures } from "./fixtures"

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

describe("importElementFromTypedYAML", () => {
  describe.each(Object.entries(groupedTypedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const model = fixture.model as { name: string }
      const context = fixture.context ?? mockContext

      const result = importElementFromTypedYAML({
        context,
        yaml: fixture.typedYAML as Parameters<typeof importElementFromTypedYAML>[0]["yaml"],
        name: model.name,
      })

      expect(result).toEqual(fixture.model)
    })
  })
})
