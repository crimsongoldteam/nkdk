import { describe, expect, it } from "vitest"
import { testAtomicFromYAML } from "../../../tests/property/atomicFromYAML"

const dateTimeRule = { type: "dateTime" } as const

describe("importDateTimeFromYAML", () => {
  it("imports russian date without time to ISO", () => {
    const result = testAtomicFromYAML({ rule: dateTimeRule, value: "01.12.1990" })
    expect(result).toEqual("1990-12-01T00:00:00")
  })

  it("imports russian date and time to ISO", () => {
    const result = testAtomicFromYAML({ rule: dateTimeRule, value: "01.12.1990 08:30" })
    expect(result).toEqual("1990-12-01T08:30:00")
  })
})
