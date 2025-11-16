import { describe, expect, it } from "vitest"
import "~/lib/metadata/forms/elements/elements"
import "~/lib/metadata/forms/elements/importFromXML"
import "~/lib/metadata/forms/elements/exportToXML"
import z from "zod"
import { ZElementType } from "../types"
import { exportUsualGroupToXML } from "./exportToXML"
import { importUsualGroupFromXML } from "./importFromXML"
import { TUsualGroup, ZUsualGroupXML, TUsualGroupXML } from "./types"
import xmlExport from "~/lib/xml/export/exporter"
import xmlImport from "~/lib/xml/import/importer"

describe("exportUsualGroupToXML", () => {
  it("should export usual group to XML with child items", () => {
    const mockElement: TUsualGroup = {
      name: "Группа",
      title: { items: { ru: "Заголовок группы" } },
      id: "1",
      childItems: [
        {
          name: "ПолеВвода",
          id: "1",
          elementType: ZElementType.enum.InputField,
        },
      ],
      elementType: ZElementType.enum.UsualGroup,
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
    const xmlString = xmlExport(
      result,
      z.object({ UsualGroup: ZUsualGroupXML }),
      false
    )

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

    const xml = xmlImport<{ UsualGroup: TUsualGroupXML }>(
      originalXml,
      z.object({ UsualGroup: ZUsualGroupXML })
    )
    const imported = importUsualGroupFromXML(xml.UsualGroup)
    const exported = exportUsualGroupToXML(imported)
    const resultXml = xmlExport(
      { UsualGroup: exported },
      z.object({ UsualGroup: ZUsualGroupXML }),
      false
    )

    expect(resultXml).toEqual(originalXml)
  })
})
