import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { xmlExport } from "~/lib/xml/export/exporter"
import exportCommandToXML from "./exportToXML"
import { Command } from "./types"

describe("exportCommandToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportCommandToXML(undefined, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })

  it("should export command", () => {
    const command: Command = {
      name: "СоставКомплектаПодобратьФайлы",
      id: "60",
      title: { items: { ru: "Файлы" } },
      toolTip: { items: { ru: "Состав комплекта подобрать файлы" } },
      action: "СоставКомплектаПодобратьФайлы",
      currentRowUse: "DontUse",
    }

    const result = exportCommandToXML(command, mockConfigurationSettings)

    const xmlString = xmlExport({ Command: result! }, false)

    const expectedResult = `<Command name="СоставКомплектаПодобратьФайлы" id="60">
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

    expect(xmlString).toBe(expectedResult)
  })
})
