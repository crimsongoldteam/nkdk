import { describe, expect, it } from "vitest"
import type { ConfigurationContext } from "../../../context/types"
import type { CollectableElement } from "../../../orchestration"
import { exportElementToEnterprise } from "../../../orchestration/formElement/toEnterprise"
import { mockContextToEnterprise } from "../../../../tests/mockContext"
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

const enterpriseGroupedFixtures = Object.fromEntries(
  Object.entries(groupedFixtures)
    .map(([g, fixtures]) => [g, fixtures.filter((f) => f.enterprise !== undefined)] as const)
    .filter(([, fixtures]) => fixtures.length > 0)
)

describe("exportElementToEnterprise", () => {
  describe.each(Object.entries(enterpriseGroupedFixtures))("%s", (_group, fixtures) => {
    it.each(fixtures)("$name", (fixture) => {
      const result = exportElementToEnterprise({
        context: createContextToEnterprise(),
        value: fixture.model as CollectableElement,
      })

      expect(result).toEqual(fixture.enterprise)
    })
  })
})
