import { describe, expect, it } from "vitest"
import { MASTER_SIMPLIFIED_CONNECTION_FORM } from "~/metadata/forms/knownAnomalies"
import { childItemsFixturesTable } from "~/tests/fixtures/childItems/data"
import { mockContextToXML, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportChildItemsToXML } from "./toXML"
import { setIdsToElements } from "../../clientApplicationForm/toXML"

describe("exportChildItemsToXML", () => {
  it.each(childItemsFixturesTable.filter((fixture) => fixture.xmlPath))("$name", ({ element, xmlPath }) => {
    const expectedXML = readXMLFileAsString(xmlPath!)

    const context = mockContextToXML()
    const result = exportChildItemsToXML(context, mockRule, element)

    setIdsToElements(context)

    const xml = xmlExport({ ChildItems: result }, false)
    expect(xml).toEqual(expectedXML)
  })

  it("restores known duplicate CommandBarButton ids for simplified connection master form", () => {
    const context = mockContextToXML()
    context.exportToXML.context!.currentXMLPath = MASTER_SIMPLIFIED_CONNECTION_FORM

    const result = exportChildItemsToXML(context, mockRule, [
      {
        itemType: "CommandBarButton",
        name: "ЕстьКЭП",
        title: { items: { ru: "Есть КЭП" } },
        extendedTooltip: { name: "ЕстьКЭПРасширеннаяПодсказка", title: { items: { ru: "Есть КЭП" } } },
      },
      {
        itemType: "CommandBarButton",
        name: "НетКЭП",
        title: { items: { ru: "Нет КЭП" } },
        extendedTooltip: { name: "НетКЭПРасширеннаяПодсказка", title: { items: { ru: "Нет КЭП" } } },
      },
      {
        itemType: "CommandBarButton",
        name: "ЕстьКЭП",
        title: { items: { ru: "Есть КЭП" } },
        extendedTooltip: { name: "ЕстьКЭПРасширеннаяПодсказка", title: { items: { ru: "Есть КЭП" } } },
      },
      {
        itemType: "CommandBarButton",
        name: "НетКЭП",
        title: { items: { ru: "Нет КЭП" } },
        extendedTooltip: { name: "НетКЭПРасширеннаяПодсказка", title: { items: { ru: "Нет КЭП" } } },
      },
    ])

    setIdsToElements(context)

    const xml = xmlExport({ ChildItems: result }, false)

    expect(xml).toContain('<Button name="ЕстьКЭП" id="1823">')
    expect(xml).toContain('<ExtendedTooltip name="ЕстьКЭПРасширеннаяПодсказка" id="1825">')
    expect(xml).toContain('<Button name="НетКЭП" id="1824">')
    expect(xml).toContain('<ExtendedTooltip name="НетКЭПРасширеннаяПодсказка" id="1826">')
    expect(xml).toContain('<Button name="ЕстьКЭП" id="1314">')
    expect(xml).toContain('<ExtendedTooltip name="ЕстьКЭПРасширеннаяПодсказка" id="1315">')
    expect(xml).toContain('<Button name="НетКЭП" id="1316">')
    expect(xml).toContain('<ExtendedTooltip name="НетКЭПРасширеннаяПодсказка" id="1317">')
  })
})
