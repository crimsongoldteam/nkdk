import { expect, it, describe } from "vitest"
import { z } from "zod"
import { xmlExport } from "~/lib"
import { exportEventsToXML } from "./exportToXML"
import { TEvents, ZEventsXML } from "./types"

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

    const result = exportEventsToXML(mockData as TEvents)
    const resultXml = xmlExport(
      { Events: result },
      z.object({ Events: ZEventsXML }),
      false
    )

    expect(resultXml).toEqual(expectedResult)
  })
})
