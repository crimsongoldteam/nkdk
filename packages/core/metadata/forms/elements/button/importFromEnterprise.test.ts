import { describe, expect, it } from "vitest"
import { FormElementType } from "~/metadata/metadataFactory/types"
import {
  fullButton,
  fullButtonPropsEnterprise,
  minimalButton,
  minimalButtonPropsEnterprise,
} from "~/tests/fixtures/forms/button/data"
import { mockСontext } from "~/tests/mockContext"
import { importButtonFromSourceEnterprise } from "./importFromEnterprise"

describe("importButtonFromSourceEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importButtonFromSourceEnterprise(mockСontext, undefined, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importButtonFromSourceEnterprise(
      mockСontext,
      { elementType: FormElementType.Button, name: "Кнопка" },
      fullButtonPropsEnterprise
    )

    expect(result).toEqual(fullButton)
  })

  it("should import minimal", () => {
    const result = importButtonFromSourceEnterprise(
      mockСontext,
      { elementType: FormElementType.Button, name: "Кнопка" },
      minimalButtonPropsEnterprise
    )

    expect(result).toEqual(minimalButton)
  })
})
