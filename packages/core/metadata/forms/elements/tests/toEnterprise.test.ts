import { describe, expect, it } from "vitest"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { CollectableElement } from "~/metadata/orchestration"
import { exportElementToEnterprise } from "~/metadata/orchestration/formElement/toEnterprise"
import { mockContextToEnterprise } from "~/tests/mockContext"
import { groupedFixtures } from "./fixtures"

const createContextToEnterprise = (): ConfigurationContext => ({
  ...mockContextToEnterprise,
  enterprise: {
    ...mockContextToEnterprise.enterprise!,
    attributes: {},
    elementsTree: [],
    allElementsNames: [],
  },
})

describe("exportElementToEnterprise", () => {
  describe.each(Object.entries(groupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fixture.model as CollectableElement,
      })

      expect(result).toEqual(fixture.enterprise)
    })
  })
})
