import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { canonicalFormSyncXML } from "./formSyncXML"

const tempDirs: string[] = []

afterEach(() => {
  for (const directory of tempDirs.splice(0)) fs.rmSync(directory, { recursive: true, force: true })
})

describe("canonicalFormSyncXML", () => {
  it("учитывает восстанавливаемые XML-defaults таблицы", () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-sync-xml-"))
    tempDirs.push(inputDir)
    const formDir = join(inputDir, "Объект", "Формы", "Форма")
    fs.mkdirSync(formDir, { recursive: true })
    fs.writeFileSync(join(formDir, "Форма.yaml"), "{}\n", "utf8")
    const expected = `<Form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:v8="http://v8.1c.ru/8.1/data/core">
	<ChildItems>
		<Table name="Таблица">
		</Table>
	</ChildItems>
</Form>`
    const result = `<Form xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:v8="http://v8.1c.ru/8.1/data/core">
	<ChildItems>
		<Table name="Таблица">
			<EnableStartDrag>true</EnableStartDrag>
			<EnableDrag>true</EnableDrag>
			<Period>
				<v8:variant xsi:type="v8:StandardPeriodVariant">Custom</v8:variant>
				<v8:startDate>0001-01-01T00:00:00</v8:startDate>
				<v8:endDate>0001-01-01T00:00:00</v8:endDate>
			</Period>
			<TopLevelParent xsi:nil="true"/>
			<RowFilter xsi:nil="true"/>
		</Table>
	</ChildItems>
</Form>`

    const canonical = canonicalFormSyncXML({
      path: "Объект/Forms/Форма/Ext/Form.xml",
      result,
      expected,
      inputDir,
    })

    expect(canonical.result).toEqual(canonical.expected)
  })

  it("не скрывает от сравнения порядок событий, заданный YAML", () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-sync-xml-"))
    tempDirs.push(inputDir)
    const formDir = join(inputDir, "Объект", "Формы", "Форма")
    fs.mkdirSync(formDir, { recursive: true })
    fs.writeFileSync(
      join(formDir, "Форма.yaml"),
      "События:\n  ПервоеСобытие: ПервыйОбработчик\n  ВтороеСобытие: ВторойОбработчик\n",
      "utf8"
    )
    const wrongOrder =
      "<Form><Events>" +
      '<Event name="Second">ВторойОбработчик</Event>' +
      '<Event name="First">ПервыйОбработчик</Event>' +
      "</Events></Form>"

    expect(() =>
      canonicalFormSyncXML({
        path: "Объект/Forms/Форма/Ext/Form.xml",
        result: wrongOrder,
        expected: wrongOrder,
        inputDir,
      })
    ).toThrow("порядок обработчиков XML")
  })

  it("не сопоставляет одинаковые группы событий разных владельцев", () => {
    const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-form-sync-xml-"))
    tempDirs.push(inputDir)
    const formDir = join(inputDir, "Объект", "Формы", "Форма")
    fs.mkdirSync(formDir, { recursive: true })
    fs.writeFileSync(
      join(formDir, "Форма.yaml"),
      [
        "Элементы:",
        "  Первый:",
        "    События:",
        "      first:",
        "        Перед: ОбщийПеред",
        "        После: ОбщийПосле",
        "  Второй:",
        "    События:",
        "      second:",
        "        Перед: ОбщийПеред",
        "        После: ОбщийПосле",
        "",
      ].join("\n"),
      "utf8"
    )
    const correct =
      "<Form><ChildItems>" +
      '<InputField name="Первый"><Events>' +
      '<Event name="First" callType="Before">ОбщийПеред</Event>' +
      '<Event name="First" callType="After">ОбщийПосле</Event>' +
      "</Events></InputField>" +
      '<InputField name="Второй"><Events>' +
      '<Event name="Second" callType="Before">ОбщийПеред</Event>' +
      '<Event name="Second" callType="After">ОбщийПосле</Event>' +
      "</Events></InputField>" +
      "</ChildItems></Form>"
    const swappedOwners =
      "<Form><ChildItems>" +
      '<InputField name="Первый"><Events>' +
      '<Event name="Second" callType="Before">ОбщийПеред</Event>' +
      '<Event name="Second" callType="After">ОбщийПосле</Event>' +
      "</Events></InputField>" +
      '<InputField name="Второй"><Events>' +
      '<Event name="First" callType="Before">ОбщийПеред</Event>' +
      '<Event name="First" callType="After">ОбщийПосле</Event>' +
      "</Events></InputField>" +
      "</ChildItems></Form>"

    expect(() =>
      canonicalFormSyncXML({
        path: "Объект/Forms/Форма/Ext/Form.xml",
        result: swappedOwners,
        expected: correct,
        inputDir,
      })
    ).toThrow("владелец Первый")
  })
})
