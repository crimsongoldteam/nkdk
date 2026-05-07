import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportFormParametersToYAML } from "./toYAML"
import { FormParameters } from "./types"

describe("exportFormParametersToYAML", () => {
  it("should export form parameter without type", () => {
    const parameters: FormParameters = [
      {
        name: "ПараметрБезТипа",
        keyParameter: true,
      },
    ]

    const result = exportFormParametersToYAML(mockContext, mockRule, parameters)

    expect(result).toStrictEqual({
      ПараметрБезТипа: {
        Ключевой: true,
      },
    })
  })
})
