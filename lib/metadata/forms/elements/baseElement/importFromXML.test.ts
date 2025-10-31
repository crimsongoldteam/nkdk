import { expect, it } from "vitest"
import { TBaseElement, TBaseElementXML, ZBaseElementXML } from "./types"
import { ZElementType } from "../types"
import { importBaseElementFromXML } from "./importFromXML"
import { xmlImport } from "~/lib"
import z from "zod"

it("should decode element from XML", () => {
  const mockXml = `<BaseElement name="ИмяПоля" id="16">`

  const mockResult: TBaseElement = {
    name: "ИмяПоля",
    elementType: ZElementType.enum.BaseElement,
    id: "16",
  }

  const xml = xmlImport<{ BaseElement: TBaseElementXML }>(mockXml, z.object({ BaseElement: ZBaseElementXML }))
  const value = xml.BaseElement

  const result = importBaseElementFromXML(value)

  expect(result).toEqual(mockResult)
})
