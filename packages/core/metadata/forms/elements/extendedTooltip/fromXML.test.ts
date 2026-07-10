import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { importPropertyFromXML, type PropertyRule } from "../../../orchestration"
import { mockContextFromXML } from "../../../../tests/mockContext"
import { readAndParseXMLFile } from "../../../../tests/readAndParseXMLFile"
import { formattedEmptyTitleExtendedTooltip, fullExtendedTooltip } from "./__fixtures__/data"

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = resolve(__dirname, "__fixtures__")
const rule = { type: "ExtendedTooltip" } satisfies PropertyRule

describe("import ExtendedTooltip from XML", () => {
  it("imports all decoration fields", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: unknown }>("full.xml", fixturesDir)

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("imports empty tooltip as minimal model", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: unknown }>("defaults.xml", fixturesDir)

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toBeUndefined()
  })

  it("imports empty formatted title", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: unknown }>("formattedEmptyTitle.xml", fixturesDir)

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toEqual(formattedEmptyTitleExtendedTooltip)
  })
})
