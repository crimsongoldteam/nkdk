import { describe, expect, it } from "vitest"

import { readAppliedObjectFixture, testPropertyFromXMLToYAML } from "../../../tests/directConversion"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { columnsYAML } from "./__fixtures__/data"

import "./register"

const rule = {
  itemType: "DocumentJournalColumnsProbe",
  properties: {
    columns: { type: "MetadataDocumentJournalColumns", yaml: "Графы", xml: "Columns" },
  },
} as MetadataItemRule

describe("MetadataDocumentJournalColumns XML → YAML", () => {
  it("imports document journal columns", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "columns.xml")

    expect(testPropertyFromXMLToYAML({ rule, xml: { Columns: xml } }).yaml).toEqual({ Графы: columnsYAML })
  })

  it("exports collection as YAML map keyed by name", () => {
    const xml = readAppliedObjectFixture(import.meta.url, "columns.xml")
    const yaml = testPropertyFromXMLToYAML({ rule, xml: { Columns: xml } }).yaml as Record<string, unknown>

    expect(yaml.Графы).toEqual(columnsYAML)
    expect(columnsYAML.Документ).not.toHaveProperty("Индексирование")
    expect(columnsYAML.Контрагент).toHaveProperty("Индексирование", "Индексировать")
    expect(columnsYAML.Документ?.Ссылки).toEqual(["Документ.ДокументЗаказ.Реквизит.Контрагент"])
  })
})
