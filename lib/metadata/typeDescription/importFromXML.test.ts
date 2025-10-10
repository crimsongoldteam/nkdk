import { expect, it } from "vitest"
import xmlImport from "~/lib/xml/import/importer"
import { TTypeDescription, TTypeDescriptionXML } from "./types"
import importTypeDescriptionFromXML from "./importFromXML"

it("should import string type from XML", () => {
  const mockXml = `<v8:Type>xs:string</v8:Type>
    <v8:StringQualifiers>
        <v8:Length>10</v8:Length>
        <v8:AllowedLength>Variable</v8:AllowedLength>
    </v8:StringQualifiers>`

  const mockResult: TTypeDescription = { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } }

  const xmlData = xmlImport<TTypeDescriptionXML>(mockXml)

  const result = importTypeDescriptionFromXML(xmlData)

  expect(result).toEqual(mockResult)
})

it("should import number type from XML", () => {
  const mockXml = `<v8:Type>xs:decimal</v8:Type>
      <v8:NumberQualifiers>
          <v8:Digits>10</v8:Digits>
          <v8:FractionDigits>2</v8:FractionDigits>
          <v8:AllowedSign>Nonnegative</v8:AllowedSign>
      </v8:NumberQualifiers>`

  const mockResult: TTypeDescription = {
    type: ["decimal"],
    numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Nonnegative" },
  }

  const xmlData = xmlImport<TTypeDescriptionXML>(mockXml)

  const result = importTypeDescriptionFromXML(xmlData)

  expect(result).toEqual(mockResult)
})

it("should import date type from XML", () => {
  const mockXml = `<v8:Type>xs:date</v8:Type>
      <v8:DateQualifiers>
          <v8:DateFractions>Date</v8:DateFractions>
      </v8:DateQualifiers>`

  const mockResult: TTypeDescription = {
    type: ["date"],
    dateQualifiers: { dateFractions: "Date" },
  }

  const xmlData = xmlImport<TTypeDescriptionXML>(mockXml)

  const result = importTypeDescriptionFromXML(xmlData)

  expect(result).toEqual(mockResult)
})

it("should import complex type from XML", () => {
  const mockXml = `<v8:Type>xs:boolean</v8:Type>
  <v8:Type>cfg:EnumRef.Статусы</v8:Type>`

  const mockResult: TTypeDescription = {
    type: ["boolean", "EnumRef.Статусы"],
  }

  const xmlData = xmlImport<TTypeDescriptionXML>(mockXml)

  const result = importTypeDescriptionFromXML(xmlData)

  expect(result).toEqual(mockResult)
})
