import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { exportPropertyToXML, type PropertyRule } from "~/metadata/orchestration"
import { setIdsToElements } from "~/metadata/forms/clientApplicationForm/toXML"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { fullExtendedTooltip, minimalExtendedTooltip } from "./__fixtures__/data"

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = resolve(__dirname, "__fixtures__")
const rule = { type: "ExtendedTooltip" } satisfies PropertyRule

const exportTooltip = (name: string, value: unknown): string => {
  const context = {
    ...mockContextToXML(),
    exportToXML: {
      ...mockContextToXML().exportToXML,
      itemsTree: [{ itemType: "Button", name, path: "" }],
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  }

  const result = exportPropertyToXML({ context, rule, value })
  setIdsToElements(context)

  return xmlExport({ ExtendedTooltip: result }, false)
}

describe("export ExtendedTooltip to XML", () => {
  it("exports all decoration fields", () => {
    const result = exportTooltip("Кнопка", fullExtendedTooltip)
    const expected = readXMLFileAsString("full.xml", fixturesDir)

    expect(result).toEqual(expected)
  })

  it("exports empty tooltip with generated name", () => {
    const result = exportTooltip("КакойТоЭлемент", minimalExtendedTooltip)
    const expected = readXMLFileAsString("defaults.xml", fixturesDir)

    expect(result).toEqual(expected)
  })
})
