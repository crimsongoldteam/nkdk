import { expect, it } from "vitest"
import importAttributeFromXML from "./importFromXML"
import { TAttribute, TAttributeXML } from "../types"
import { xmlImport } from "~/lib"

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

  const mockResult: TAttribute = {
    name: "Поле",
    id: "1",
    type: { type: ["string"], stringQualifiers: { length: 0, allowedLength: "Variable" } },
    title: { ru: "Заголовок поля" },
  }

  const xmlData = xmlImport<TAttributeXML>(mockXml)

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

  const mockResult: TAttribute = {
    name: "Фамилия",
    id: "1",
    type: { type: ["string"] },
    mainAttribute: true,
    storedData: true,
  }

  const xmlData = xmlImport<TAttributeXML>(mockXml)

  const result = importAttributeFromXML(xmlData)

  expect(result).toEqual(mockResult)
})

it("should ignore ConditionalAppearance from XML", () => {
  const mockXml = `<ConditionalAppearance></ConditionalAppearance>`

  const xmlData = xmlImport<TAttributeXML>(mockXml)

  const result = importAttributeFromXML(xmlData)

  expect(result).toBeUndefined()
})
