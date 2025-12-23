import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { xmlExport } from "~/lib/xml/export/exporter"
import { exportEventsToXML } from "./exportToXML"
import { Events } from "./types"

describe("exportEventsToXML", () => {
  it("should export events", () => {
    const expectedResult = `<Events>
	<Event name="Click">РаспознаваниеДокументаНадписьНажатие</Event>
	<Event name="OnChange">ОбработкаИзменения</Event>
</Events>`

    const mockData = {
      click: "РаспознаваниеДокументаНадписьНажатие",
      onChange: "ОбработкаИзменения",
    }

    const result = exportEventsToXML(mockcontext, mockData as Events)
    const resultXml = xmlExport({ Events: result }, false)

    expect(resultXml).toEqual(expectedResult)
  })
})
