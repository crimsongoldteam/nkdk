import { describe, expect, it } from "vitest"

import { rowsToCompletionValues } from "./items"

describe("rowsToCompletionValues", () => {
  it("keeps explicit completion value fields", () => {
    expect(rowsToCompletionValues([{ value: "Catalog.A.Form.F", label: "Форма", detail: "FORM" }])).toEqual([
      { value: "Catalog.A.Form.F", label: "Форма", detail: "FORM" },
    ])
  })

  it("uses first string column when value is absent", () => {
    expect(rowsToCompletionValues([{ id: "Справочник.А.Форма.Ф" }])).toEqual([
      { value: "Справочник.А.Форма.Ф", label: "Справочник.А.Форма.Ф" },
    ])
  })
})
