import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { MetadataFunctionalOptionRules } from "./rules"

import "./types"

describe("import MetadataFunctionalOption from YAML", () => {
  it("imports subsystem and accounting flag content targets", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: MetadataFunctionalOptionRules,
      name: "ИспользоватьФинансовыеИнструменты",
      yaml: {
        СоставФункциональнойОпции: [
          "Подсистема.Казначейство.Подсистема.ФинансовыеИнструменты",
          "ПланСчетов.Хозрасчетный.ПризнакУчета.УчетПоНаправлениямДеятельности",
        ],
      },
    })

    expect(result?.content).toEqual([
      "Subsystem.Казначейство.Subsystem.ФинансовыеИнструменты",
      "ChartOfAccounts.Хозрасчетный.AccountingFlag.УчетПоНаправлениямДеятельности",
    ])
  })
})
