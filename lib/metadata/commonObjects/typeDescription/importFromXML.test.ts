import { readFileSync } from "fs"
import { join } from "path"
import { assertEquals } from "typia"
import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlImport } from "~/lib/xml/import/importer"
import { importTypeDescriptionFromXML } from "./importFromXML"
import { TypeDescription, TypeDescriptionXML } from "./types"

describe("importTypeDescriptionFromXML", () => {
  it("should import string type from XML", () => {
    const mockXml = `<TypeDescription>
    <v8:Type>xs:string</v8:Type>
    <v8:StringQualifiers>
        <v8:Length>10</v8:Length>
        <v8:AllowedLength>Variable</v8:AllowedLength>
    </v8:StringQualifiers>
    </TypeDescription>`

    const mockResult: TypeDescription = {
      type: ["string"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
    }

    const xmlData = xmlImport<{ TypeDescription?: TypeDescriptionXML }>(mockXml)

    expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(xmlData.TypeDescription, mockConfigurationSettings)

    expect(result).toEqual(mockResult)
  })

  it("should import number type from XML", () => {
    const mockXml = `<TypeDescription>
  <v8:Type>xs:decimal</v8:Type>
  <v8:NumberQualifiers>
      <v8:Digits>10</v8:Digits>
      <v8:FractionDigits>2</v8:FractionDigits>
      <v8:AllowedSign>Nonnegative</v8:AllowedSign>
  </v8:NumberQualifiers> 
</TypeDescription>`

    const mockResult: TypeDescription = {
      type: ["decimal"],
      numberQualifiers: {
        digits: 10,
        fractionDigits: 2,
        allowedSign: "Nonnegative",
      },
    }

    const xmlData = xmlImport<{ TypeDescription?: TypeDescriptionXML }>(mockXml)

    expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(xmlData.TypeDescription, mockConfigurationSettings)

    expect(result).toEqual(mockResult)
  })

  it("should import date type from XML", () => {
    const mockXml = `<TypeDescription>
    <v8:Type>xs:dateTime</v8:Type>
      <v8:DateQualifiers>
          <v8:DateFractions>Date</v8:DateFractions>
      </v8:DateQualifiers>
      </TypeDescription>`

    const mockResult: TypeDescription = {
      type: ["dateTime"],
      dateQualifiers: { dateFractions: "Date" },
    }

    const xmlData = xmlImport<{ TypeDescription?: TypeDescriptionXML }>(mockXml)

    expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(xmlData.TypeDescription, mockConfigurationSettings)

    expect(result).toEqual(mockResult)
  })

  it("should import complex type from XML", () => {
    const mockXml = `<TypeDescription>
    <v8:Type>xs:boolean</v8:Type>
    <v8:Type>cfg:EnumRef.Статусы</v8:Type>
    </TypeDescription>`

    const mockResult: TypeDescription = {
      type: ["boolean", "EnumRef.Статусы"],
    }

    const xmlData = xmlImport<{ TypeDescription?: TypeDescriptionXML }>(mockXml)

    expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(xmlData.TypeDescription, mockConfigurationSettings)

    expect(result).toEqual(mockResult)
  })

  it("should import three types from XML", () => {
    const mockXml = `<TypeDescription>
    <v8:Type>cfg:CatalogRef.Сотрудники</v8:Type>
    <v8:Type>cfg:CatalogRef.Контрагенты</v8:Type>
    <v8:Type>cfg:CatalogRef.Пользователи</v8:Type>
    </TypeDescription>`

    const mockResult: TypeDescription = {
      type: ["CatalogRef.Сотрудники", "CatalogRef.Контрагенты", "CatalogRef.Пользователи"],
    }

    const xmlData = xmlImport<{ TypeDescription?: TypeDescriptionXML }>(mockXml)

    expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(xmlData.TypeDescription, mockConfigurationSettings)

    expect(result).toEqual(mockResult)
  })

  it("should import SpreadsheetDocument from XML", () => {
    const mockXml = `<TypeDescription>
    <v8:Type xmlns:mxl="http://v8.1c.ru/8.2/data/spreadsheet">mxl:SpreadsheetDocument</v8:Type>
    </TypeDescription>`

    const mockResult: TypeDescription = {
      type: ["SpreadsheetDocument"],
    }

    const xmlData = xmlImport<{ TypeDescription?: TypeDescriptionXML }>(mockXml)

    expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(xmlData.TypeDescription, mockConfigurationSettings)

    expect(result).toEqual(mockResult)
  })

  it("should import type set from XML", () => {
    const xml = readFileSync(join(process.cwd(), "tests/fixtures/typeDescription/typeSet.xml"), "utf-8")

    const mockResult: TypeDescription = {
      type: ["Characteristic.ДополнительныеРеквизитыИСведения"],
    }

    const xmlData = xmlImport<{ TypeDescription?: TypeDescriptionXML }>(xml)

    expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(xmlData.TypeDescription, mockConfigurationSettings)

    expect(result).toEqual(mockResult)
  })

  it("should import empty type from XML", () => {
    const mockXml = `<TypeDescription>
  </TypeDescription>`

    const xmlData = xmlImport<{ TypeDescription?: TypeDescriptionXML }>(mockXml)

    expect(assertEquals<TypeDescriptionXML>(xmlData.TypeDescription)).toEqual(xmlData.TypeDescription)

    const result = importTypeDescriptionFromXML(xmlData.TypeDescription, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })
})
