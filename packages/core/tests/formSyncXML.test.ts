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
