import { describe, it, expect } from "vitest"
import { TCommand, TCommandXML } from "./types"
import { xmlImport } from "~/lib"
import importCommandFromXML from "./importFromXML"

describe("importCommandFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importCommandFromXML(undefined)

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

    const expectedResult: TCommand = {
      name: "СоставКомплектаПодобратьФайлы",
      id: "60",
      title: { ru: "Файлы" },
      toolTip: { ru: "Состав комплекта подобрать файлы" },
      action: "СоставКомплектаПодобратьФайлы",
      currentRowUse: "DontUse",
    }

    const xmlData = xmlImport<{ Command: TCommandXML }>(mockXml)

    const result = importCommandFromXML(xmlData.Command)

    expect(result).toEqual(expectedResult)
  })
})
