import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { PredefinedRules } from "./rules"

import "./types"

describe("export Predefined to YAML", () => {
  it("экспортирует items как корневой Record (без обёртки items:)", () => {
    const data = {
      itemType: "Predefined",
      items: [{ name: "X", code: "001", description: "X", isFolder: false }],
    } as any
    const result = exportMetadataItemToYAML({
      context: mockContext,
      data,
      rule: PredefinedRules,
    })
    expect(result).toEqual({
      X: { Код: "001", Наименование: "X" },
    })
  })
})
