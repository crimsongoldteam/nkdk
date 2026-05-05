import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { PredefinedRules } from "./rules"

import "./types"

describe("import Predefined from YAML", () => {
  it("inline-record парсится в items без обёртки", () => {
    const yaml = {
      ПредопределенноеЗначение: { Код: "000000001", Наименование: "Тест", ЭтоГруппа: false },
    }
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: yaml as any,
      rule: PredefinedRules,
      name: "predefined",
    })
    expect(result).toMatchObject({ itemType: "Predefined" })
    expect(result?.items?.[0]).toMatchObject({
      name: "ПредопределенноеЗначение",
      code: "000000001",
      description: "Тест",
      isFolder: false,
    })
  })
})
