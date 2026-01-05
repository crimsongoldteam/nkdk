import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/elements"
import "~/metadata/forms/elements/exportToXML"
import "~/metadata/forms/elements/importFromXML"
import { mockСontext } from "~/tests/mockContext"
import { xmlExport } from "~/xml/export/exporter"
import { xmlImport } from "~/xml/import/importer"
import { FormElementType } from "../../../metadataFactory/types"
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

    const expectedResult = `<UsualGroup id="1" name="Группа">
	<ChildItems>
		<InputField id="1" name="ПолеВвода"/>
	</ChildItems>
	<Title>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Заголовок группы</v8:content>
		</v8:item>
	</Title>
</UsualGroup>`

    const result = { UsualGroup: exportUsualGroupToXML(mockСontext, mockElement) }
    const xmlString = xmlExport(result, false)

    expect(xmlString).toEqual(expectedResult)
  })

  it("should return undefined for undefined input", () => {
    const result = exportUsualGroupToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export and import usual group with child items correctly (round-trip)", () => {
    const originalXml = `<UsualGroup id="1" name="Группа">
	<ChildItems>
		<InputField id="1" name="ПолеВвода"/>
	</ChildItems>
	<Title>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Заголовок группы</v8:content>
		</v8:item>
	</Title>
	<Visible>false</Visible>
</UsualGroup>`

    const xml = xmlImport<{ UsualGroup: UsualGroupXML }>(originalXml)
    const imported = importUsualGroupFromXML(mockСontext, xml.UsualGroup)
    const exported = exportUsualGroupToXML(mockСontext, imported)
    const resultXml = xmlExport({ UsualGroup: exported }, false)

    expect(resultXml).toEqual(originalXml)
  })
})
