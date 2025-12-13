import { describe, expect, it } from "vitest"
import { TUsualGroup } from "./types"
import { importUsualGroupFromXML } from "./importFromXML"
import { TUsualGroupXML } from "./types"
import { xmlImport } from "~/lib"
import { FormElementType } from "../types"
import z from "zod"
import { ZUsualGroupXML } from "./types"

describe("importUsualGroupFromXML", () => {
  it("should import usual group from XML", () => {
    const mockXml = `	<UsualGroup name="Группа" id="1">
    <Title>
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Заголовок группы</v8:content>
      </v8:item>
    </Title>
  </UsualGroup>`

    const mockResult: TUsualGroup = {
      name: "Группа",
      title: { items: { ru: "Заголовок группы" } },
      id: "1",
      childItems: [],
      elementType: FormElementType.UsualGroup,
    }

    const xmlData = xmlImport<{ UsualGroup: TUsualGroupXML }>(mockXml, z.object({ UsualGroup: ZUsualGroupXML }))
    const value = xmlData.UsualGroup

    const input = importUsualGroupFromXML(value)

    expect(input).toEqual(mockResult)
  })

  it("should import usual group from XML with child items", () => {
    const mockXml = `<UsualGroup name="Группа" id="1">
    <Title>
      <v8:item>
        <v8:lang>ru</v8:lang>
        <v8:content>Заголовок группы</v8:content>
      </v8:item>
    </Title>
    <ChildItems>
  		<InputField name="ПолеВвода" id="1"/>
	  </ChildItems>
  </UsualGroup>`

    const mockResult: TUsualGroup = {
      name: "Группа",
      title: { items: { ru: "Заголовок группы" } },
      id: "1",
      childItems: [{ name: "ПолеВвода", id: "1", elementType: FormElementType.InputField }],
      elementType: FormElementType.UsualGroup,
    }

    const xmlData = xmlImport<{ UsualGroup: TUsualGroupXML }>(mockXml, z.object({ UsualGroup: ZUsualGroupXML }))
    const value = xmlData.UsualGroup

    const input = importUsualGroupFromXML(value)

    expect(input).toEqual(mockResult)
  })
})
