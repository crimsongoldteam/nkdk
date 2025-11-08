import { describe, it, expect } from "vitest"
import { TCommand, TCommandXML, ZCommandXML } from "./types"
import { xmlExport } from "~/lib"
import exportCommandToXML from "./exportToXML"
import z from "zod"

describe("exportCommandToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportCommandToXML(undefined)

    expect(result).toBeUndefined()
  })

  it("should export command", () => {
    const command: TCommand = {
      name: "СоставКомплектаПодобратьФайлы",
      id: "60",
      title: { items: { ru: "Файлы" } },
      toolTip: { items: { ru: "Состав комплекта подобрать файлы" } },
      action: "СоставКомплектаПодобратьФайлы",
      currentRowUse: "DontUse",
    }

    const result = exportCommandToXML(command)

    const xmlString = xmlExport<{ Command: TCommandXML }>(
      { Command: result! },
      z.object({ Command: ZCommandXML }),
      false
    )

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
