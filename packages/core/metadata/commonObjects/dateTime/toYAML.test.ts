import { describe, expect, it } from "vitest"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"

const dateTimeRule = { type: "dateTime", yaml: "Дата" } as const

describe("exportDateTimeToYAML", () => {
  it("exports ISO date without time when midnight", () => {
    const result = testExportPropertyToYAML({ rule: dateTimeRule, value: "1990-12-01T00:00:00" })
    expect(result).toEqual({ Дата: "01.12.1990" })
  })

  it("exports ISO date with time when not midnight", () => {
    const result = testExportPropertyToYAML({ rule: dateTimeRule, value: "1990-12-01T08:30:00" })
    expect(result).toEqual({ Дата: "01.12.1990 08:30" })
  })
})
