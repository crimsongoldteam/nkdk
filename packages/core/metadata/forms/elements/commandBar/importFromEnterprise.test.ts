import { describe, expect, it } from "vitest"
import {
  fullCommandBar,
  fullCommandBarPartialEnterprise,
  fullCommandBarTypedEnterprise,
  minimalCommandBar,
  minimalCommandBarTypedEnterprise,
} from "~/tests/fixtures/forms/commandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { importCommandBarPartialFromEnterprise, importCommandBarTypedFromEnterprise } from "./importFromEnterprise"

describe("importCommandBarFromEnterprise", () => {
  describe("importCommandBarTypedFromEnterprise", () => {
    it("should return undefined when source is undefined", () => {
      const result = importCommandBarTypedFromEnterprise(mockСontext, undefined, "КоманднаяПанель")

      expect(result).toBeUndefined()
    })

    it("should import all fields from Enterprise", () => {
      const result = importCommandBarTypedFromEnterprise(mockСontext, fullCommandBarTypedEnterprise, "КоманднаяПанель")

      expect(result).toEqual(fullCommandBar)
    })

    it("should import minimal", () => {
      const result = importCommandBarTypedFromEnterprise(
        mockСontext,
        minimalCommandBarTypedEnterprise,
        "КоманднаяПанель"
      )

      expect(result).toEqual(minimalCommandBar)
    })
  })

  describe("importCommandBarPartialFromEnterprise", () => {
    // it("should return undefined when source is undefined", () => {
    //   const result = importCommandBarPartialFromEnterprise(mockСontext, undefined, undefined)

    //   expect(result).toBeUndefined()
    // })

    it("should import all fields from Enterprise", () => {
      const result = importCommandBarPartialFromEnterprise(mockСontext, fullCommandBar, fullCommandBarPartialEnterprise)

      expect(result).toEqual(fullCommandBar)
    })
  })
})
