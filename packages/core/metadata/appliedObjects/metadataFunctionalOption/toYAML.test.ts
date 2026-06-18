import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { MetadataFunctionalOptionRules } from "./rules"
import type { MetadataFunctionalOption } from "./types"

import "./types"

describe("export MetadataFunctionalOption to YAML", () => {
  it("exports object and accounting flag content targets", () => {
    const data: MetadataFunctionalOption = {
      itemType: "MetadataFunctionalOption",
      name: "ИспользоватьФинансовыеИнструменты",
      content: [
        "Subsystem.ФинансовыеИнструменты",
        "ChartOfAccounts.Хозрасчетный.AccountingFlag.УчетПоНаправлениямДеятельности",
      ],
    }

    const result = exportMetadataItemToYAML({
      context: mockContext,
      rule: MetadataFunctionalOptionRules,
      data,
    })

    expect(result).toEqual({
      СоставФункциональнойОпции: [
        "Подсистема.ФинансовыеИнструменты",
        "ПланСчетов.Хозрасчетный.ПризнакУчета.УчетПоНаправлениямДеятельности",
      ],
    })
  })
})
