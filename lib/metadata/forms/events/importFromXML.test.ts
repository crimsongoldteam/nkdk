import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { xmlImport } from "~/lib/xml/import/importer"
import { importEventsFromXML } from "./importFromXML"
import { EventsXML } from "./types"

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
    const result = importEventsFromXML(mockcontext, xml.Events)

    expect(result).toEqual(expectedResult)
  })
})
