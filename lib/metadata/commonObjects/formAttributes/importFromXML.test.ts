import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import importAttributeFromXML from "./importFromXML"
import { FormAttribute, FormAttributeItemXML } from "./types"

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

    const mockResult: FormAttribute = {
      name: "Поле",
      id: "1",
      valueType: {
        type: ["string"],
        stringQualifiers: { length: 0, allowedLength: "Variable" },
      },
      title: { items: { ru: "Заголовок поля" } },
    }

    const xmlData = xmlImport<{ Attribute: FormAttributeItemXML }>(mockXml)

    const result = importAttributeFromXML(xmlData, mockConfigurationSettings)

    expect(result).toEqual(mockResult)
  })

  it("should import attribute with empty type", () => {
    const mockXml = `<Attribute name="Фамилия" id="1">
 			<Type/>
		</Attribute>`

    const mockResult: FormAttribute = {
      name: "Фамилия",
      id: "1",
    }

    const xmlData = xmlImport<AttributeXML>(mockXml)

    const result = importAttributeFromXML(xmlData, mockConfigurationSettings)

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

    const mockResult: FormAttribute = {
      name: "Фамилия",
      id: "1",
      type: { type: ["string"] },
      mainAttribute: true,
      storedData: true,
    }

    const xmlData = xmlImport<{ Attributes: AttributeXML[] }>(mockXml)

    const result = importAttributeFromXML(xmlData.Attributes?.[0], mockConfigurationSettings)

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

    const xmlData = xmlImport<{ Attributes: AttributeXML[] }>(mockXml)

    const result = importAttributeFromXML(xmlData.Attributes?.[0] as AttributeXML, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })
})
