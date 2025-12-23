import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlImport } from "~/lib/xml/import/importer"
import importCommandFromXML from "./importFromXML"
import { Command, CommandXML } from "./types"

describe("importCommandFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importCommandFromXML(mockConfigurationSettings, undefined)

    expect(result).toBeUndefined()
  })

  it("should import command", () => {
    const mockXml = `<Command name="СоставКомплектаПодобратьФайлы" id="60">
			<Title>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Файлы</v8:content>
				</v8:item>
			</Title>
			<ToolTip>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Состав комплекта подобрать файлы</v8:content>
				</v8:item>
			</ToolTip>
			<Action>СоставКомплектаПодобратьФайлы</Action>
			<CurrentRowUse>DontUse</CurrentRowUse>
		</Command>`

    const expectedResult: Command = {
      name: "СоставКомплектаПодобратьФайлы",
      id: "60",
      title: { items: { ru: "Файлы" } },
      toolTip: { items: { ru: "Состав комплекта подобрать файлы" } },
      action: "СоставКомплектаПодобратьФайлы",
      currentRowUse: "DontUse",
    }

    const xmlData = xmlImport<{ Command: CommandXML }>(mockXml)

    const result = importCommandFromXML(mockConfigurationSettings, xmlData.Command)

    expect(result).toEqual(expectedResult)
  })
})
