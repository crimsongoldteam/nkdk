import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "../../orchestration"
import { mockContext } from "../../../tests/mockContext"
import { AdditionalIndexRules } from "./rules"

import "./types"

describe("import AdditionalIndex from YAML", () => {
  it("inline-array парсится в items без обёртки", () => {
    const yaml = [
      {
        Имя: "Индекс1",
        Таблица: "Catalog.СправочникCоВсемиОбъектами",
        ИндексируемыеПоля: ["Ref"],
        ДополнительныеПоля: ["Description"],
      },
    ]
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: yaml as any,
      rule: AdditionalIndexRules,
      name: "additionalIndex",
    })
    expect(result).toMatchObject({ itemType: "AdditionalIndex" })
    expect(result?.items?.[0]).toMatchObject({
      name: "Индекс1",
      table: "Catalog.СправочникCоВсемиОбъектами",
      indexedFields: ["Ref"],
      additionalFields: ["Description"],
    })
  })
})
