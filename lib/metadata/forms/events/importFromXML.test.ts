import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib/xml/import/importer"
import { importEventsFromXML } from "./importFromXML"
import { EventsXML } from "./types"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"

describe("importEventsFromXML", () => {
  it("should import events", () => {
    const mockXml = `
    <Events>
      <Event name="Click">РаспознаваниеДокументаНадписьНажатие</Event>
      <Event name="OnChange">ОбработкаИзменения</Event>
    </Events>
    `

    const expectedResult = {
      click: "РаспознаваниеДокументаНадписьНажатие",
      onChange: "ОбработкаИзменения",
    }

    const xml = xmlImport<{ Events: EventsXML }>(mockXml)
    const result = importEventsFromXML(xml.Events, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
