import { describe, expect, it } from "vitest"
import { MASTER_SIMPLIFIED_CONNECTION_FORM } from "../../knownAnomalies"
import { childItemsFixturesTable } from "./__fixtures__/data"
import { mockContextToXML, mockRule } from "../../../../tests/mockContext"
import { readXMLFileAsString } from "../../../../tests/readAndParseXMLFile"
import { xmlExport } from "../../../../xml/export/exporter"
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

    const items = [
      {
        itemType: "CommandBarButton",
        name: "ЕстьКЭП",
        title: { formatted: false, items: { ru: "Есть КЭП" } },
        extendedTooltip: {
          itemType: "ExtendedTooltip",
          name: "ЕстьКЭПРасширеннаяПодсказка",
          title: { formatted: false, items: { ru: "Есть КЭП" } },
        },
      },
      {
        itemType: "CommandBarButton",
        name: "НетКЭП",
        title: { formatted: false, items: { ru: "Нет КЭП" } },
        extendedTooltip: {
          itemType: "ExtendedTooltip",
          name: "НетКЭПРасширеннаяПодсказка",
          title: { formatted: false, items: { ru: "Нет КЭП" } },
        },
      },
      {
        itemType: "CommandBarButton",
        name: "ЕстьКЭП",
        title: { formatted: false, items: { ru: "Есть КЭП" } },
        extendedTooltip: {
          itemType: "ExtendedTooltip",
          name: "ЕстьКЭПРасширеннаяПодсказка",
          title: { formatted: false, items: { ru: "Есть КЭП" } },
        },
      },
      {
        itemType: "CommandBarButton",
        name: "НетКЭП",
        title: { formatted: false, items: { ru: "Нет КЭП" } },
        extendedTooltip: {
          itemType: "ExtendedTooltip",
          name: "НетКЭПРасширеннаяПодсказка",
          title: { formatted: false, items: { ru: "Нет КЭП" } },
        },
      },
    ] as const
    const referenceItems: Array<
      (typeof items)[number] & {
        id: string
        extendedTooltip: NonNullable<(typeof items)[number]["extendedTooltip"]> & { id: string }
      }
    > = [
      { ...items[0], id: "1823", extendedTooltip: { ...items[0].extendedTooltip, id: "1825" } },
      { ...items[1], id: "1824", extendedTooltip: { ...items[1].extendedTooltip, id: "1826" } },
      { ...items[2], id: "1314", extendedTooltip: { ...items[2].extendedTooltip, id: "1315" } },
      { ...items[3], id: "1316", extendedTooltip: { ...items[3].extendedTooltip, id: "1317" } },
    ]

    const result = exportChildItemsToXML(context, mockRule, [...items], referenceItems)

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
