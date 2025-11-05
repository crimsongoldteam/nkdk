import { expect, it } from "vitest"
import xmlExport from "~/lib/xml/export/exporter"
import { TTypeDescription, ZTypeDescriptionXML } from "./types"
import { exportTypeDescriptionToXML } from "./exportToXML"
import z from "zod"

it("should export string type to XML", () => {
  const mockTypeDescription: TTypeDescription = {
    type: ["string"],
    stringQualifiers: {
      length: 10,
      allowedLength: "Variable",
    },
  }

  const expectedXml = `<TypeDescription>
	<v8:Type>xs:string</v8:Type>
	<v8:StringQualifiers>
		<v8:Length>10</v8:Length>
		<v8:AllowedLength>Variable</v8:AllowedLength>
	</v8:StringQualifiers>
</TypeDescription>`

  const result = exportTypeDescriptionToXML(mockTypeDescription)
  const xmlString = xmlExport({ TypeDescription: result }, z.object({ TypeDescription: ZTypeDescriptionXML }), false)

  expect(xmlString).toEqual(expectedXml)
})

it("should export number type to XML", () => {
  const mockTypeDescription: TTypeDescription = {
    type: ["decimal"],
    numberQualifiers: {
      digits: 10,
      fractionDigits: 2,
      allowedSign: "Nonnegative",
    },
  }

  const expectedXml = `<TypeDescription>
	<v8:Type>xs:decimal</v8:Type>
	<v8:NumberQualifiers>
		<v8:Digits>10</v8:Digits>
		<v8:FractionDigits>2</v8:FractionDigits>
		<v8:AllowedSign>Nonnegative</v8:AllowedSign>
	</v8:NumberQualifiers>
</TypeDescription>`

  const result = exportTypeDescriptionToXML(mockTypeDescription)
  const xmlString = xmlExport({ TypeDescription: result }, z.object({ TypeDescription: ZTypeDescriptionXML }), false)

  expect(xmlString).toEqual(expectedXml)
})

it("should export date type to XML", () => {
  const mockTypeDescription: TTypeDescription = {
    type: ["date"],
    dateQualifiers: {
      dateFractions: "Date",
    },
  }

  const expectedXml = `<TypeDescription>
	<v8:Type>xs:date</v8:Type>
	<v8:DateQualifiers>
		<v8:DateFractions>Date</v8:DateFractions>
	</v8:DateQualifiers>
</TypeDescription>`

  const result = exportTypeDescriptionToXML(mockTypeDescription)
  const xmlString = xmlExport({ TypeDescription: result }, z.object({ TypeDescription: ZTypeDescriptionXML }), false)

  expect(xmlString).toEqual(expectedXml)
})

it("should export complex type to XML", () => {
  const mockTypeDescription: TTypeDescription = {
    type: ["boolean", "EnumRef.Статусы"],
  }

  const expectedXml = `<TypeDescription>
	<v8:Type>xs:boolean</v8:Type>
	<v8:Type>cfg:EnumRef.Статусы</v8:Type>
</TypeDescription>`

  const result = exportTypeDescriptionToXML(mockTypeDescription)
  const xmlString = xmlExport({ TypeDescription: result }, z.object({ TypeDescription: ZTypeDescriptionXML }), false)

  expect(xmlString).toEqual(expectedXml)
})
