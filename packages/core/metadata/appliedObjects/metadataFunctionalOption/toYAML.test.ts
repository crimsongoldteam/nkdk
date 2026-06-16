import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { MetadataFunctionalOptionRules } from "./rules"
import type { MetadataFunctionalOption } from "./types"

import "./types"

describe("export MetadataFunctionalOption to YAML", () => {
  it("exports subsystem and accounting flag content targets", () => {
    const data: MetadataFunctionalOption = {
      itemType: "MetadataFunctionalOption",
      name: "ИспользоватьФинансовыеИнструменты",
      content: [
        "Subsystem.Казначейство.Subsystem.ФинансовыеИнструменты",
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
        "Подсистема.Казначейство.Подсистема.ФинансовыеИнструменты",
        "ПланСчетов.Хозрасчетный.ПризнакУчета.УчетПоНаправлениямДеятельности",
      ],
    })
  })
})
