import { describe, expect, it } from "vitest"
import type { CollectableElement } from "~/metadata/orchestration"
import { importElementFromPartialYAML, importElementFromTypedYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { commandButtonWithTypeDescriptionParameter } from "../button/__fixtures__/data"
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

describe("importElementFromPartialYAML preserve", () => {
  it("preserves TypeDescription Parameter from source when YAML omits Parameter", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "Button",
      yaml: {
        ИмяКоманды: "Form.Item.Список.StandardCommand.CreateByParameter",
      },
      source: commandButtonWithTypeDescriptionParameter,
    })

    expect(result).toEqual(commandButtonWithTypeDescriptionParameter)
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
