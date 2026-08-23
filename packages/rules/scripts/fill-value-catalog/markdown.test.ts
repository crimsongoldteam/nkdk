import { describe, expect, it } from "vitest"
import { aggregateObservations } from "./aggregate"
import type { FillValueObservation } from "./model"
import { renderCatalogMarkdown } from "./markdown"
import { referenceObservation } from "./testSupport"

describe("Markdown-отчёт FillValue", () => {
  it("группирует даты и ссылки по смысловым категориям", () => {
    const observations: FillValueObservation[] = [
      {
        configuration: "doc",
        file: "Documents/A.xml",
        ownerKind: "Document",
        attributeKind: "ordinary",
        attributeName: "Дата",
        itemKind: "Attribute",
        type: {
          source: "xml",
          family: "dateTime",
          signature: "dateTime(DateTime)",
          alternatives: [{ kind: "dateTime", dateFractions: "DateTime" }],
        },
        raw: { form: "typedText", xsiType: "xs:dateTime", text: "2026-08-23T10:20:30" },
        typedValue: { type: "dateTime", value: "2026-08-23T10:20:30" },
        valueCategory: "explicit",
        rulesClassification: "explicit",
      },
      referenceObservation({
        configuration: "doc",
        file: "Catalogs/C.xml",
        attributeName: "Контрагент",
        value: "Catalog.Контрагенты.EmptyRef",
        valueCategory: "emptyRef",
      }),
    ]
    const report = aggregateObservations({
      observations,
      unresolved: [{ configuration: "doc", file: "Unknown/X.xml", element: "Properties", reason: "неподдержанная конструкция" }],
      examplesLimit: 2,
    })

    const markdown = renderCatalogMarkdown(report)

    expect(markdown).toContain("## Дата и время")
    expect(markdown).toContain("| ДатаВремя (дата и время) | Явное значение | Обычный | typedText | 1 | 1 | 1 | однозначно |")
    expect(markdown).toContain("## Ссылки")
    expect(markdown).toContain("Справочник.Контрагенты")
    expect(markdown).toContain("Пустая ссылка")
    expect(markdown).toContain("## Неразобранное")
    expect(markdown).toContain("Unknown/X.xml")
  })
})
