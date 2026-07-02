import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../../tests/mockContext"
import { importFormParametersFromYAML } from "./fromYAML"
import { FormParametersYAML } from "./types"

describe("importFormParametersFromYAML", () => {
  it("should import form parameter without type", () => {
    const data: FormParametersYAML = {
      ПараметрБезТипа: {
        Ключевой: true,
      },
    }

    const result = importFormParametersFromYAML(mockContext, mockRule, data)

    expect(result).toStrictEqual([
      {
        name: "ПараметрБезТипа",
        keyParameter: true,
      },
    ])
  })
})
