import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { xmlExport } from "~/packages/core/xml/export/exporter"
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

    const result = exportEventsToXML(mockСontext, mockData as Events)
    const resultXml = xmlExport({ Events: result }, false)

    expect(resultXml).toEqual(expectedResult)
  })
})
