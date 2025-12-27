import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import { xmlImport } from "~/xml/import/importer"
import { FormElementType } from "../../../metadataFactory/types"
import { importUsualGroupFromXML } from "./importFromXML"
import { UsualGroup, UsualGroupXML } from "./types"

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

    const mockResult: UsualGroup = {
      name: "Группа",
      title: { items: { ru: "Заголовок группы" } },
      id: "1",
      childItems: [],
      elementType: FormElementType.UsualGroup,
    }

    const xmlData = xmlImport<{ UsualGroup: UsualGroupXML }>(mockXml)
    const value = xmlData.UsualGroup

    const input = importUsualGroupFromXML(mockСontext, value)

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

    const mockResult: UsualGroup = {
      name: "Группа",
      title: { items: { ru: "Заголовок группы" } },
      id: "1",
      childItems: [{ name: "ПолеВвода", id: "1", elementType: FormElementType.InputField }],
      elementType: FormElementType.UsualGroup,
    }

    const xmlData = xmlImport<{ UsualGroup: UsualGroupXML }>(mockXml)
    const value = xmlData.UsualGroup

    const input = importUsualGroupFromXML(mockСontext, value)

    expect(input).toEqual(mockResult)
  })
})
