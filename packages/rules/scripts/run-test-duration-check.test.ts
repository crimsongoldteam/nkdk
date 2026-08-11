import { describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся исполняемым JavaScript без отдельной декларации типов.
import { parseDurationCheckArguments } from "../../../scripts/run-test-duration-check.mjs"

describe("run test duration check", () => {
  it("выбирает стандартный предел по умолчанию", () => {
    expect(parseDurationCheckArguments(["--", "--project", "unit"])).toEqual({
      suite: "standard",
      vitestArguments: ["--project", "unit"],
    })
  })

  it("выбирает интеграционный предел явным флагом", () => {
    expect(parseDurationCheckArguments(["--integration", "--", "--project", "integration"])).toEqual({
      suite: "integration",
      vitestArguments: ["--project", "integration"],
    })
  })
})
