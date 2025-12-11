import { expect, it, describe } from "vitest"
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

    const result = exportEventsToXML(mockData as Events)
    const resultXml = xmlExport({ Events: result }, false)

    expect(resultXml).toEqual(expectedResult)
  })
})
