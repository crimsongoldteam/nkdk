import { describe, expect, it } from "vitest"
import { xmlExport, xmlImport } from "~/lib"
import "~/lib/metadata/forms/elements/elements"
import "~/lib/metadata/forms/elements/exportToXML"
import "~/lib/metadata/forms/elements/importFromXML"
import { FormElementType } from "../types"
import { exportUsualGroupToXML } from "./exportToXML"
import { importUsualGroupFromXML } from "./importFromXML"
import { UsualGroup, UsualGroupXML } from "./types"

describe("exportUsualGroupToXML", () => {
  it("should export usual group to XML with child items", () => {
    const mockElement: UsualGroup = {
      name: "Группа",
      title: { items: { ru: "Заголовок группы" } },
      id: "1",
      childItems: [
        {
          name: "ПолеВвода",
          id: "1",
          elementType: FormElementType.InputField,
        },
      ],
      elementType: FormElementType.UsualGroup,
    }

    const expectedResult = `<UsualGroup name="Группа" id="1">
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

    const result = { UsualGroup: exportUsualGroupToXML(mockElement) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportUsualGroupToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import usual group with child items correctly (round-trip)", () => {
    const originalXml = `<UsualGroup name="Группа" id="1">
	<Visible>false</Visible>
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

    const xml = xmlImport<{ UsualGroup: UsualGroupXML }>(originalXml)
    const imported = importUsualGroupFromXML(xml.UsualGroup)
    const exported = exportUsualGroupToXML(imported)
    const resultXml = xmlExport({ UsualGroup: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
