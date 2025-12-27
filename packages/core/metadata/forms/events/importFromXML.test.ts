import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { xmlImport } from "~/packages/core/xml/import/importer"
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
    const result = importEventsFromXML(mockСontext, xml.Events)

    expect(result).toEqual(expectedResult)
  })
})
