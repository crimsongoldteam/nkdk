import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { MetadataFunctionalOptionRules } from "./rules"

import "./types"

describe("import MetadataFunctionalOption from YAML", () => {
  it("imports object and accounting flag content targets", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: MetadataFunctionalOptionRules,
      name: "ИспользоватьФинансовыеИнструменты",
      yaml: {
        СоставФункциональнойОпции: [
          "Подсистема.ФинансовыеИнструменты",
          "ПланСчетов.Хозрасчетный.ПризнакУчета.УчетПоНаправлениямДеятельности",
        ],
      },
    })

    expect(result?.content).toEqual([
      "Subsystem.ФинансовыеИнструменты",
      "ChartOfAccounts.Хозрасчетный.AccountingFlag.УчетПоНаправлениямДеятельности",
    ])
  })
})
