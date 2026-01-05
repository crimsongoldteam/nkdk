import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { xmlImport } from "~/xml/import/importer"
import { FormElementType } from "../../../metadataFactory/types"
import { importInputFieldFromXML } from "./importFromXML"
import { InputField, InputFieldXML } from "./types"

describe("importInputFieldFromXML", () => {
  it("should import name from XML", () => {
    const mockXml = `<InputField name="ИмяПоля" id="16">
    <Title>
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Поле</v8:content>
      </v8:item>
    </Title>
  </InputField>`

    const expectedResult: InputField = {
      name: "ИмяПоля",
      elementType: FormElementType.InputField,
      title: { items: { ru: "Поле" } },
      id: "16",
    }

    const xml = xmlImport<{ InputField: InputFieldXML }>(mockXml)

    const input = importInputFieldFromXML(mockСontext, xml.InputField)

    expect(input).toEqual(expectedResult)
  })
})
