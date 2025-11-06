import { expect, it, describe } from "vitest"
import { z } from "zod"
import { xmlExport, xmlImport } from "~/lib"
import { exportEventsToXML } from "./exportToXML"
import { importEventsFromXML } from "./importFromXML"
import { TEventsXML, ZEventsXML } from "./types"


describe("exportEventsToXML", () => {
  it("should export events", () => {
    const data = {
      click: "РаспознаваниеДокументаНадписьНажатие",
    }

    const result = exportEventsToXML(data)

    expect(result).toBeDefined()
    expect(result?.Event).toBeDefined()
    
    if (result?.Event) {
      const eventArray = Array.isArray(result.Event) ? result.Event : [result.Event]
      expect(eventArray).toHaveLength(1)
      expect(eventArray[0]._name).toBe("Click")
      expect(eventArray[0]["#text"]).toBe("РаспознаваниеДокументаНадписьНажатие")
    }
  })

  it("should export multiple events", () => {
    const data = {
      click: "РаспознаваниеДокументаНадписьНажатие",
      onChange: "ОбработкаИзменения",
    }

    const result = exportEventsToXML(data)

    expect(result).toBeDefined()
    expect(result?.Event).toBeDefined()
    
    if (result?.Event) {
      const eventArray = Array.isArray(result.Event) ? result.Event : [result.Event]
      expect(eventArray).toHaveLength(2)
      
      const clickEvent = eventArray.find(e => e._name === "Click")
      expect(clickEvent).toBeDefined()
      expect(clickEvent?.["#text"]).toBe("РаспознаваниеДокументаНадписьНажатие")
      
      const onChangeEvent = eventArray.find(e => e._name === "OnChange")
      expect(onChangeEvent).toBeDefined()
      expect(onChangeEvent?.["#text"]).toBe("ОбработкаИзменения")
    }
  })

  it("should return undefined for empty events", () => {
    const result = exportEventsToXML(undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined for empty object", () => {
    const result = exportEventsToXML({})
    expect(result).toBeUndefined()
  })

  it("should export to XML format", () => {
    const data = {
      click: "РаспознаваниеДокументаНадписьНажатие",
    }

    const xmlData = exportEventsToXML(data)
    expect(xmlData).toBeDefined()

    if (xmlData) {
      const xml = xmlExport<TEventsXML>(xmlData, ZEventsXML, false)
      expect(xml).toContain('<Event name="Click">')
      expect(xml).toContain('РаспознаваниеДокументаНадписьНажатие')
      expect(xml).toContain('</Event>')
    }
  })

  it("should round-trip import and export", () => {
    const originalData = {
      click: "РаспознаваниеДокументаНадписьНажатие",
      onChange: "ОбработкаИзменения",
    }

    // Export to XML
    const xmlData = exportEventsToXML(originalData)
    expect(xmlData).toBeDefined()

    if (xmlData) {
      // Export to XML string
      const xmlString = xmlExport<{ Events: TEventsXML }>(
        { Events: xmlData },
        z.object({ Events: ZEventsXML }),
        false
      )

      // Import back from XML
      const importedXml = xmlImport<{ Events: TEventsXML }>(
        xmlString,
        z.object({ Events: ZEventsXML })
      )
      const importedData = importEventsFromXML(importedXml.Events)

      expect(importedData).toEqual(originalData)
    }
  })
})

