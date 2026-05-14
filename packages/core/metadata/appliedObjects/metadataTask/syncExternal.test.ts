import fs from "fs"
import { mkdtempSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { MetadataTaskRules } from "./rules"

describe("external sync — MetadataTask", () => {
  const name = "ЗадачаВсеСвойства"

  it("copies object modules from XML to nkdk", async () => {
    const inputDir = mkdtempSync(join(tmpdir(), "task-xml-"))
    fs.copyFileSync(new URL("__fixtures__/sync/xml/ЗадачаВсеСвойства.xml", import.meta.url), join(inputDir, `${name}.xml`))
    fs.mkdirSync(join(inputDir, name, "Ext"), { recursive: true })
    fs.writeFileSync(join(inputDir, name, "Ext", "ObjectModule.bsl"), "Процедура ПриЗаписи()\nКонецПроцедуры\n")
    fs.writeFileSync(join(inputDir, name, "Ext", "ManagerModule.bsl"), "Функция Версия()\n\tВозврат 1;\nКонецФункции\n")
    const outputDir = mkdtempSync(join(tmpdir(), "task-nkdk-"))

    await convertAppliedObjectFromXML({
      rule: MetadataTaskRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "МодульОбъекта.bsl"), "utf-8")).toBe(
      "Процедура ПриЗаписи()\nКонецПроцедуры\n"
    )
    expect(fs.readFileSync(join(outputDir, name, "МодульМенеджера.bsl"), "utf-8")).toBe(
      "Функция Версия()\n\tВозврат 1;\nКонецФункции\n"
    )
  })

  it("writes object modules from nkdk to XML", async () => {
    const inputDir = mkdtempSync(join(tmpdir(), "task-nkdk-"))
    const objectDir = join(inputDir, name)
    fs.mkdirSync(objectDir, { recursive: true })
    fs.writeFileSync(join(objectDir, "Свойства.yaml"), "")
    fs.writeFileSync(join(objectDir, "МодульОбъекта.bsl"), "Процедура ПередЗаписью()\nКонецПроцедуры\n")
    fs.writeFileSync(join(objectDir, "МодульМенеджера.bsl"), "Функция Код()\n\tВозврат 7;\nКонецФункции\n")
    const referenceDir = mkdtempSync(join(tmpdir(), "task-ref-"))
    fs.copyFileSync(
      new URL("__fixtures__/sync/xml/ЗадачаВсеСвойства.xml", import.meta.url),
      join(referenceDir, `${name}.xml`)
    )
    const outputDir = mkdtempSync(join(tmpdir(), "task-xml-"))

    await syncAppliedObjectToXML({
      rule: MetadataTaskRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(referenceDir, name),
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "ObjectModule.bsl"), "utf-8")).toBe(
      "Процедура ПередЗаписью()\nКонецПроцедуры\n"
    )
    expect(fs.readFileSync(join(outputDir, name, "Ext", "ManagerModule.bsl"), "utf-8")).toBe(
      "Функция Код()\n\tВозврат 7;\nКонецФункции\n"
    )
  })
})
