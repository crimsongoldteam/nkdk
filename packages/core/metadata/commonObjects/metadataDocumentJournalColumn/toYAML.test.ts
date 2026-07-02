import { describe, expect, it } from "vitest"
import { columnsFromXML, columnsYAML } from "./__fixtures__/data"
import { exportMetadataDocumentJournalColumnsToYAML } from "./register"
import { mockContext } from "../../../tests/mockContext"

describe("export MetadataDocumentJournalColumns to YAML", () => {
  it("exports collection as YAML map keyed by name", () => {
    const result = exportMetadataDocumentJournalColumnsToYAML(mockContext, undefined, columnsFromXML)

    expect(result).toEqual(columnsYAML)
    expect(result?.Документ).not.toHaveProperty("Индексирование")
    expect(result?.Контрагент).toHaveProperty("Индексирование", "Индексировать")
    expect(result?.Документ?.Ссылки).toEqual(["Документ.ДокументЗаказ.Реквизит.Контрагент"])
  })
})
