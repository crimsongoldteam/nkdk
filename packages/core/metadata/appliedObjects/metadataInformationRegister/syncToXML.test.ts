import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { beforeAll, describe, expect, it } from "vitest"
import { syncAppliedObjectToXML } from "../../orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { mockContextToXML } from "../../../tests/mockContext"
import { MetadataInformationRegisterRules } from "./rules"
import { canonicalXML } from "../../../tests/canonicalXML"
import { canonicalFormSyncXML } from "../../../tests/formSyncXML"

const normalizeLineEndings = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("syncAppliedObjectToXML — MetadataInformationRegister", () => {
  let preparedInformationRegister: Awaited<ReturnType<typeof testSyncAppliedObjectToXML>>

  beforeAll(async () => {
    preparedInformationRegister = await testSyncAppliedObjectToXML({
      rule: MetadataInformationRegisterRules,
      name: "РегистрСведенийВсеСвойстваНезависимый",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: [
        "РегистрСведенийВсеСвойстваНезависимый.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Ext/AdditionalIndexes.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Ext/Help.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Ext/Help/ru.html",
        "РегистрСведенийВсеСвойстваНезависимый/Commands/Команда1/Ext/CommandModule.bsl",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаСписка.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаСписка/Ext/Form.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаСписка/Ext/Form/Module.bsl",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаЗаписи.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаЗаписи/Ext/Form.xml",
        "РегистрСведенийВсеСвойстваНезависимый/Forms/ФормаЗаписи/Ext/Form/Module.bsl",
        "РегистрСведенийВсеСвойстваНезависимый/Templates/Макет.xml",
      ],
    })
  })

  it("читает InformationRegister из YAML и записывает XML в outputDir", () => {
    const { inputDir, comparisons } = preparedInformationRegister
    for (const { path, result, expected } of comparisons) {
      if (path.endsWith("/Ext/Form.xml")) {
        const form = canonicalFormSyncXML({ path, result, expected, inputDir })
        expect(form.result, path).toEqual(form.expected)
      } else if (path.endsWith(".xml")) {
        expect(canonicalXML(result), path).toEqual(canonicalXML(expected))
      } else {
        expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
      }
    }
  })

  it("восстанавливает object-level модули регистра сведений при YAML to XML sync", async () => {
    const name = "РегистрСведенийВсеСвойстваНезависимый"
    const testDir = dirname(fileURLToPath(import.meta.url))
    const fixturesDir = join(testDir, "__fixtures__", "sync")
    const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "information-register-sync-modules-"))
    const inputDir = join(tmpDir, "yaml")
    const referenceDir = join(fixturesDir, "xml")
    const outputDir = join(tmpDir, "out")
    const inputObjectDir = join(inputDir, name)
    const managerModule =
      "Процедура ОбработкаПолученияДанныхВыбора(ДанныеВыбора, Параметры, СтандартнаяОбработка)\nКонецПроцедуры\n"
    const recordSetModule = "Процедура ПередЗаписью(Отказ, Замещение)\nКонецПроцедуры\n"

    await fs.promises.mkdir(inputObjectDir, { recursive: true })
    await fs.promises.copyFile(
      join(fixturesDir, "yaml", name, "Свойства.yaml"),
      join(inputObjectDir, "Свойства.yaml")
    )
    await fs.promises.writeFile(join(inputObjectDir, "МодульМенеджера.bsl"), managerModule)
    await fs.promises.writeFile(join(inputObjectDir, "МодульНабораЗаписей.bsl"), recordSetModule)

    await syncAppliedObjectToXML({
      rule: MetadataInformationRegisterRules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(referenceDir, name),
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "ManagerModule.bsl"), "utf-8")).toBe(managerModule)
    expect(fs.readFileSync(join(outputDir, name, "Ext", "RecordSetModule.bsl"), "utf-8")).toBe(recordSetModule)
  })
})
