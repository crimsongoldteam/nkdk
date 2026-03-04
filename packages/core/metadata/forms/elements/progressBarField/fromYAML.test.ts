import { describe, expect, it } from "vitest"
import { importElementFromPartialYAML } from "~/metadata/metadataFactory"
import {
  fullProgressBarField,
  fullProgressBarFieldPartialYAML,
  minimalProgressBarField,
  minimalProgressBarFieldPartialYAML,
} from "~/tests/fixtures/forms/progressBarField/data"
import { mockContext } from "~/tests/mockContext"

describe("importProgressBarFieldFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "ProgressBarField",
      yaml: fullProgressBarFieldPartialYAML,
      source: fullProgressBarField,
    })

    expect(result).toEqual(fullProgressBarField)
  })

  it("should import minimal", () => {
    const result = importElementFromPartialYAML({
      context: mockContext,
      itemType: "ProgressBarField",
      yaml: minimalProgressBarFieldPartialYAML,
      source: minimalProgressBarField,
    })

    expect(result).toEqual(minimalProgressBarField)
  })
})
