import fs from "fs"
import os from "os"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it, vi } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { MetadataCommonFormRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

const name = "КонстантаВсеСвойства"

const createCommonFormTempFixture = async () => {
  const testDir = dirname(fileURLToPath(import.meta.url))
  const fixturesDir = join(testDir, "__fixtures__", "sync")
  const tmpDir = fs.mkdtempSync(join(os.tmpdir(), "common-form-module-"))
  const inputDir = join(tmpDir, "xml")
  const yamlDir = join(tmpDir, "yaml")
  const outputDir = join(tmpDir, "out")
  const moduleText = "Процедура ПриСозданииНаСервере(Отказ, СтандартнаяОбработка)\nКонецПроцедуры\n"

  await fs.promises.cp(join(fixturesDir, "xml"), inputDir, { recursive: true })
  await fs.promises.cp(join(fixturesDir, "yaml"), yamlDir, { recursive: true })
  await fs.promises.mkdir(join(inputDir, name, "Ext", "Form"), { recursive: true })
  await fs.promises.writeFile(join(inputDir, name, "Ext", "Form", "Module.bsl"), moduleText)
  await fs.promises.writeFile(join(yamlDir, name, "Модуль.bsl"), moduleText)

  return { inputDir, yamlDir, outputDir, moduleText }
}

describe("syncAppliedObjectToXML — MetadataCommonForm", () => {
  it("writes CommonForm XML and external form XML", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      name,
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["КонстантаВсеСвойства.xml", "КонстантаВсеСвойства/Ext/Form.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })

  it("enables ClientApplicationForm export after direct MetadataCommonFormRules import", async () => {
    vi.resetModules()

    const { clearTypeRulesRegistry, getTypeRule } = await import("~/metadata/orchestration/formElement/factory")
    clearTypeRulesRegistry()
    expect(getTypeRule("ClientApplicationForm", "exportToXML")).toBeUndefined()

    const { MetadataCommonFormRules } = await import("./rules")
    const { createEmptyClientApplicationForm } = await import("~/metadata/forms/clientApplicationForm/createEmpty")
    const { exportPropertyToXML } = await import("~/metadata/orchestration/property/toXML")
    const { mockContextToXML } = await import("~/tests/mockContext")

    const exportToXML = getTypeRule("ClientApplicationForm", "exportToXML")
    expect(exportToXML).toBeTypeOf("function")

    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule: MetadataCommonFormRules.properties.form,
      value: createEmptyClientApplicationForm(),
    })

    expect(result).toMatchObject({
      Form: {
        _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
      },
    })
  })

  it("copies common form Module.bsl from XML to YAML", async () => {
    const { inputDir, outputDir, moduleText } = await createCommonFormTempFixture()

    await convertAppliedObjectFromXML({
      rule: MetadataCommonFormRules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "Модуль.bsl"), "utf-8")).toBe(moduleText)
  })

  it("keeps common form Module.bsl during YAML to XML sync cleanup", async () => {
    const { inputDir, yamlDir, outputDir, moduleText } = await createCommonFormTempFixture()

    await syncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      context: mockContextToXML(),
      inputDir: yamlDir,
      name,
      outputDir,
      referenceDir: inputDir,
      externalOutputDir: join(outputDir, name),
      externalReferenceDir: join(inputDir, name),
    })

    expect(fs.readFileSync(join(outputDir, name, "Ext", "Form", "Module.bsl"), "utf-8")).toBe(moduleText)
  })
})
