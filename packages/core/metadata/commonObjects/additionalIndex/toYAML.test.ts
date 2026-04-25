import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { AdditionalIndexRules } from "./rules"

import "./types"

describe("export AdditionalIndex to YAML", () => {
  it("экспортирует items как корневой массив (без обёртки items:)", () => {
    const data = {
      itemType: "AdditionalIndex",
      items: [
        {
          itemType: "AdditionalIndexItem",
          name: "Индекс1",
          table: "Catalog.СправочникCоВсемиОбъектами",
          indexedFields: ["Ref"],
          additionalFields: ["Description"],
        },
      ],
    } as any
    const result = exportMetadataItemToYAML({
      context: mockContext,
      data,
      rule: AdditionalIndexRules,
    })
    expect(result).toEqual([
      {
        Имя: "Индекс1",
        Таблица: "Catalog.СправочникCоВсемиОбъектами",
        ИндексируемыеПоля: ["Ref"],
        ДополнительныеПоля: ["Description"],
      },
    ])
  })
})
