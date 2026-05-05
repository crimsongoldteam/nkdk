import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { fullStandartBeginningDate, fullStandartBeginningDateYAML } from "./__fixtures__/data"
import { importStandartBeginningDateFromYAML } from "./fromYAML"

describe("importStandartBeginningDateFromYAML", () => {
  it("imports full fixture", () => {
    expect(importStandartBeginningDateFromYAML(mockContext, mockRule, fullStandartBeginningDateYAML)).toEqual(
      fullStandartBeginningDate
    )
  })
})
