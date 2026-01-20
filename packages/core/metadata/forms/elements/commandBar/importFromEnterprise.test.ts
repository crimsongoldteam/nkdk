import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import "~/metadata/forms/elements/importFromEnterprise"
import {
  fullCommandBar,
  fullCommandBarAllItems,
  fullCommandBarPartialEnterprise,
  sourceCommandBar,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { importCommandBarPartialFromEnterprise } from "./importFromEnterprise"

describe("importCommandBarFromEnterprise", () => {
  describe("importCommandBarPartialFromEnterprise", () => {
    it("should import all fields from Enterprise", () => {
      const context: ConfigurationContext = {
        ...mockСontext,
        allElements: fullCommandBarAllItems,
      }
      const result = importCommandBarPartialFromEnterprise(context, sourceCommandBar, fullCommandBarPartialEnterprise)

      expect(result).toEqual(fullCommandBar)
    })
  })
})
