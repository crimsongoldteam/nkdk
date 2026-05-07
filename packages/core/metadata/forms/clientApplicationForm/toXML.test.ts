import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { readAndParseXMLFixture, readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import {
  conditionalAppearanceWithoutAttributesClientApplicationForm,
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "./__fixtures__/data"
import { importClientApplicationFormFromXML } from "./fromXML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "./toXML"
import { ClientApplicationFormXML, FormMetadataXML } from "./types"

describe("exportToXML", () => {
  describe("exportClientApplicationFormToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "full.xml")

      const referenceForm = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "full.xml")

      const referenceMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "fullMetadata.xml"
      )

      const clientApplicationFormReference = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: referenceForm.Form,
        xmlMetadata: referenceMetadata.MetaDataObject,
      })

      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: fullClientApplicationForm,
        referenceForm: clientApplicationFormReference,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "minimal.xml")
      const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
        import.meta.url,
        "minimal.xml"
      )
      const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "minimalMetadata.xml"
      )
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: referenceFormXML.Form,
        xmlMetadata: referenceMetadataXML.MetaDataObject,
      })
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: minimalClientApplicationForm,
        referenceForm,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("exports conditional appearance without attributes", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "conditionalAppearanceWithoutAttributes.xml")
      const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
        import.meta.url,
        "conditionalAppearanceWithoutAttributes.xml"
      )
      const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "minimalMetadata.xml"
      )
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: referenceFormXML.Form,
        xmlMetadata: referenceMetadataXML.MetaDataObject,
      })
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: conditionalAppearanceWithoutAttributesClientApplicationForm,
        referenceForm,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("не добавляет Period и TopLevelParent для таблицы DynamicList без referenceForm", () => {
      const context = mockContextToXML()
      const xmlData = exportClientApplicationFormToXML({
        context,
        form: {
          ...minimalClientApplicationForm,
          attributes: [
            {
              itemType: "FormAttribute",
              name: "Список",
              type: { type: ["DynamicList"] },
              columns: [],
            },
          ],
          childItems: [
            {
              itemType: "Table",
              name: "Список",
              dataPath: "Список",
              id: undefined,
            },
          ],
        },
        referenceForm: undefined,
      })

      const childItems: Array<{ Table?: { Period?: unknown; TopLevelParent?: unknown } }> = Array.isArray(
        xmlData.ChildItems,
      )
        ? xmlData.ChildItems
        : []
      const table = childItems[0]?.Table

      expect(table?.Period).toBeUndefined()
      expect(table?.TopLevelParent).toBeUndefined()
      expect(context.exportToXML.cypherCache).toBeUndefined()
    })

    it("сохраняет Period и TopLevelParent для таблицы из referenceForm", () => {
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: {
          ...minimalClientApplicationForm,
          attributes: [
            {
              itemType: "FormAttribute",
              name: "Список",
              type: { type: ["DynamicList"] },
              columns: [],
            },
          ],
          childItems: [
            {
              itemType: "Table",
              name: "Список",
              dataPath: "Список",
              id: undefined,
            },
          ],
        },
        referenceForm: {
          ...minimalClientApplicationForm,
          attributes: [
            {
              itemType: "FormAttribute",
              name: "Список",
              type: { type: ["DynamicList"] },
              columns: [],
            },
          ],
          childItems: [
            {
              itemType: "Table",
              name: "Список",
              dataPath: "Список",
              id: undefined,
              period: undefined,
              topLevelParent: undefined,
            },
          ],
        },
      })

      const childItems: Array<{ Table?: { Period?: unknown; TopLevelParent?: unknown } }> = Array.isArray(
        xmlData.ChildItems,
      )
        ? xmlData.ChildItems
        : []
      const table = childItems[0]?.Table

      expect(table?.Period).toEqual({
        "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
        "v8:startDate": "0001-01-01T00:00:00",
        "v8:endDate": "0001-01-01T00:00:00",
      })
      expect(table?.TopLevelParent).toEqual({ "_xsi:nil": "true" })
    })

    it("не добавляет RowFilter для обычного реквизита без referenceForm", () => {
      const context = mockContextToXML()
      const xmlData = exportClientApplicationFormToXML({
        context,
        form: {
          ...minimalClientApplicationForm,
          attributes: [
            {
              itemType: "FormAttribute",
              name: "Объект",
              type: { type: ["CatalogObject.БонусныеПрограммыЛояльности"] },
              columns: [],
            },
          ],
          childItems: [
            {
              itemType: "Table",
              name: "ЦеновыеГруппы",
              dataPath: "Объект.ЦеновыеГруппы",
              id: undefined,
            },
          ],
        },
        referenceForm: undefined,
      })

      const childItems: Array<{ Table?: { RowFilter?: unknown } }> = Array.isArray(xmlData.ChildItems)
        ? xmlData.ChildItems
        : []
      const table = childItems[0]?.Table

      expect(table?.RowFilter).toBeUndefined()
      expect(context.exportToXML.cypherCache).toBeUndefined()
    })

    it("сохраняет RowFilter для таблицы из referenceForm", () => {
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: {
          ...minimalClientApplicationForm,
          attributes: [
            {
              itemType: "FormAttribute",
              name: "Объект",
              type: { type: ["CatalogObject.БонусныеПрограммыЛояльности"] },
              columns: [],
            },
          ],
          childItems: [
            {
              itemType: "Table",
              name: "ЦеновыеГруппы",
              dataPath: "Объект.ЦеновыеГруппы",
              id: undefined,
            },
          ],
        },
        referenceForm: {
          ...minimalClientApplicationForm,
          attributes: [
            {
              itemType: "FormAttribute",
              name: "Объект",
              type: { type: ["CatalogObject.БонусныеПрограммыЛояльности"] },
              columns: [],
            },
          ],
          childItems: [
            {
              itemType: "Table",
              name: "ЦеновыеГруппы",
              dataPath: "Объект.ЦеновыеГруппы",
              id: undefined,
              rowFilter: undefined,
            },
          ],
        },
      })

      const childItems: Array<{ Table?: { RowFilter?: unknown } }> = Array.isArray(xmlData.ChildItems)
        ? xmlData.ChildItems
        : []
      const table = childItems[0]?.Table

      expect(table?.RowFilter).toEqual({ "_xsi:nil": "true" })
    })

    it("preserves command ids from reference form by name", () => {
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: {
          ...minimalClientApplicationForm,
          commands: [
            {
              itemType: "FormCommand",
              name: "Команда1",
              title: { items: { ru: "Команда один" } },
            },
            {
              itemType: "FormCommand",
              name: "Команда2",
              title: { items: { ru: "Команда два" } },
            },
          ],
        },
        referenceForm: {
          ...minimalClientApplicationForm,
          commands: [
            {
              itemType: "FormCommand",
              name: "Команда1",
              id: "7",
              title: { items: { ru: "Старое имя один" } },
            },
            {
              itemType: "FormCommand",
              name: "Команда2",
              id: "9",
              title: { items: { ru: "Старое имя два" } },
            },
          ],
        },
      })

      expect(xmlData.Commands?.Command).toEqual([
        {
          _name: "Команда1",
          _id: "7",
          Title: {
            "v8:item": [{ "v8:lang": "ru", "v8:content": "Команда один" }],
          },
        },
        {
          _name: "Команда2",
          _id: "9",
          Title: {
            "v8:item": [{ "v8:lang": "ru", "v8:content": "Команда два" }],
          },
        },
      ])
    })
  })

  describe("exportFormMetadataToXML", () => {
    it("should export all fields to XML", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "fullMetadata.xml")
      const xmlData = exportFormMetadataToXML({
        context: mockContextToXML(),
        form: fullClientApplicationForm,
        referenceForm: undefined,
        name: "ФормаКакаяТо",
      })

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })

    it("should export minimal", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "minimalMetadata.xml")
      const minimalFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "minimal.xml")
      const minimalMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "minimalMetadata.xml"
      )
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: minimalFormXML.Form,
        xmlMetadata: minimalMetadataXML.MetaDataObject,
      })
      const xmlData = exportFormMetadataToXML({
        context: mockContextToXML(),
        form: minimalClientApplicationForm,
        referenceForm,
        name: "Минимальная",
      })

      const result = xmlExport({ MetaDataObject: xmlData })

      expect(result).toEqual(expectedResult)
    })
  })
})
