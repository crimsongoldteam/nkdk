import { expect, it, describe } from "vitest"
import { z } from "zod"
import { xmlImport } from "~/lib"
import { importEventsFromXML } from "./importFromXML"
import { TEventsXML, ZEventsXML } from "./types"

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

    const xml = xmlImport<{ Events: TEventsXML }>(
      mockXml,
      z.object({ Events: ZEventsXML })
    )
    const result = importEventsFromXML(xml.Events)

    expect(result).toEqual(expectedResult)
  })
})
