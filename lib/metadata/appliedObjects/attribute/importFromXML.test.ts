import { describe, expect, it } from "vitest"
import importAttributeFromXML from "./importFromXML"
import { IAttribute, IAttributeXML, IAttributesXML } from "../types"
import { xmlImport } from "~/lib"
import { ZAttributeXML, ZAttributesXML } from "../types"
import z from "zod"

describe("importAttributeFromXML", () => {
  it("should import attribute from XML", () => {
    const mockXml = `<Attribute name="Поле" id="1">
			<Title>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Заголовок поля</v8:content>
				</v8:item>
			</Title>
			<Type>
				<v8:Type>xs:string</v8:Type>
				<v8:StringQualifiers>
					<v8:Length>0</v8:Length>
					<v8:AllowedLength>Variable</v8:AllowedLength>
				</v8:StringQualifiers>
			</Type>
		</Attribute>`

    const mockResult: IAttribute = {
      name: "Поле",
      id: "1",
      type: {
        type: ["string"],
        stringQualifiers: { length: 0, allowedLength: "Variable" },
      },
      title: { items: { ru: "Заголовок поля" } },
    }

    const xmlData = xmlImport<IAttributeXML>(mockXml, ZAttributeXML)

    const result = importAttributeFromXML(xmlData)

    expect(result).toEqual(mockResult)
  })

  it("should import attribute with empty type", () => {
    const mockXml = `<Attribute name="Фамилия" id="1">
 			<Type/>
		</Attribute>`

    const mockResult: IAttribute = {
      name: "Фамилия",
      id: "1",
    }

    const xmlData = xmlImport<IAttributeXML>(mockXml, ZAttributeXML)

    const result = importAttributeFromXML(xmlData)

    expect(result).toEqual(mockResult)
  })

  it("should import stored and main attribute from XML", () => {
    const mockXml = `<Attribute name="Фамилия" id="1">
 			<Type>
				<v8:Type>xs:string</v8:Type>
			</Type>
			<MainAttribute>true</MainAttribute>
      <StoredData>true</StoredData>
		</Attribute>`

    const mockResult: IAttribute = {
      name: "Фамилия",
      id: "1",
      type: { type: ["string"] },
      mainAttribute: true,
      storedData: true,
    }

    const xmlData = xmlImport<IAttributeXML>(mockXml, ZAttributeXML)

    const result = importAttributeFromXML(xmlData)

    expect(result).toEqual(mockResult)
  })

  it("should ignore ConditionalAppearance from XML", () => {
    const mockXml = `
  <Attributes>
    <ConditionalAppearance>
      <dcsset:item>
      </dcsset:item>
    </ConditionalAppearance>
  </Attributes>`

    const xmlData = xmlImport<{ Attributes: IAttributesXML }>(
      mockXml,
      z.object({ Attributes: ZAttributesXML })
    )

    const result = importAttributeFromXML(
      xmlData.Attributes[0] as IAttributeXML
    )

    expect(result).toBeUndefined()
  })
})
