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
})
