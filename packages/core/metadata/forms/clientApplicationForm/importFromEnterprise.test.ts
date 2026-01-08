import { describe, expect, it } from "vitest"
import {
  fullClientApplicationForm,
  fullClientApplicationFormEnterprise,
  minimalClientApplicationForm,
  minimalClientApplicationFormEnterprise,
} from "~/tests/fixtures/forms/clientApplicationForm/data"
import { mockСontext } from "~/tests/mockContext"
import { importClientApplicationFormFromEnterprise } from "./importFromEnterprise"

describe("importClientApplicationFormFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importClientApplicationFormFromEnterprise(mockСontext, undefined, "Форма")

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importClientApplicationFormFromEnterprise(mockСontext, fullClientApplicationFormEnterprise, "Форма")

    // Поля, которые не экспортируются в Enterprise формат, не могут быть импортированы
    const expected = { ...fullClientApplicationForm }
    delete expected.attributes
    delete expected.autoCommandBar
    delete expected.childItems
    delete expected.commandSet
    delete expected.useForFoldersAndItems

    expect(result).toEqual(expected)
  })

  it("should import minimal", () => {
    const result = importClientApplicationFormFromEnterprise(
      mockСontext,
      minimalClientApplicationFormEnterprise,
      "Форма"
    )

    // Поля, которые не экспортируются в Enterprise формат, не могут быть импортированы
    const expected = { ...minimalClientApplicationForm }
    delete expected.autoCommandBar
    delete expected.childItems

    expect(result).toEqual(expected)
  })
})
