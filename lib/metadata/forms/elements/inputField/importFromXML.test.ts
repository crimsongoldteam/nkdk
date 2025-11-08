import { describe, expect, it } from "vitest"
import { importInputFieldFromXML } from "./importFromXML"
import { TInputField, TInputFieldXML, ZInputFieldXML } from "./types"
import { ZElementType } from "../types"
import { xmlImport } from "~/lib"
import z from "zod"

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

    const expectedResult: TInputField = {
      name: "ИмяПоля",
      elementType: ZElementType.enum.InputField,
      title: { items: { ru: "Поле" } },
      id: "16",
    }

    const xml = xmlImport<{ InputField: TInputFieldXML }>(
      mockXml,
      z.object({ InputField: ZInputFieldXML })
    )

    const input = importInputFieldFromXML(xml.InputField)

    expect(input).toEqual(expectedResult)
  })
})
