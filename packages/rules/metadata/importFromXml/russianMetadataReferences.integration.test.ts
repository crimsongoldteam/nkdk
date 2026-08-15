import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { importConfigurationFromXml } from "./importConfiguration"
import { mockContextFromXML } from "../../tests/mockContext"
import {
  createImportProjectStateTestService,
  createInspectableXmlImportWorkerTestPool,
} from "../../tests/xmlImportWorkerTestPool"
import { createPreparedYamlWorkerThreadPoolFactory } from "../../tests/preparedYamlWorkerTestPool"
import { createPreparedYamlProjectWorkerPool } from "../project/preparedYamlProjectWorkerPool"
import { metadataRules } from "../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../composition/metadataExecutionContext"

const sourceInputDir = join(import.meta.dirname, "../../../../e2e/fixtures/xml/cf")
const inputDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-russian-metadata-input-"))
const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-russian-metadata-references-"))
const workerCount = 3
const importWorkerPool = createInspectableXmlImportWorkerTestPool(workerCount)
const xmlImportWorkerPoolHandle = importWorkerPool.handle
const preparedYamlWorkerFactory = createPreparedYamlWorkerThreadPoolFactory()
const projectState = createImportProjectStateTestService({
  createPool: (concurrency) => createPreparedYamlProjectWorkerPool({
    concurrency,
    createWorkerPool: preparedYamlWorkerFactory,
  }),
})
const registries = createMetadataExecutionRegistrySets(metadataRules)
let importResult: Awaited<ReturnType<typeof importConfigurationFromXml>>

beforeAll(async () => {
  copyRepresentativeFixtures()
  importResult = await withMetadataExecutionRegistrySets(registries, () => importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency: workerCount,
    operationId: "russian-metadata-references",
    xmlImportWorkerPoolHandle,
    projectState,
  }))
}, 120_000)

afterAll(async () => {
  await Promise.all([xmlImportWorkerPoolHandle.close(), projectState.close()])
  for (const directory of [inputDir, projectDir]) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

describe("Russian metadata references XML import", () => {
  it("imports representative metadata references in Russian form", () => {
    expect(importResult.failed.filter(({ code }) => code !== "project_validation")).toEqual([])

    const command = readYaml("ОбщаяФорма/Команды/Свойства.yaml")
    expect(command).toContain("Администратор: Ложь")
    expect(command).toContain("- ФункциональнаяОпцияБулево")
    expect(readYaml("ОбщаяФорма/Форма/Свойства.yaml"))
      .toContain("ОсновнаяТаблица: Справочник.СправочникПолный")
    expect(readYaml("Задача/ЗадачаВсеСвойства/Свойства.yaml")).toContain([
      "ВидыХарактеристик: РегистрСведений.ЗначенияХарактеристикОбъектов",
      "ЗначенияХарактеристик: Справочник.СправочникПолный",
    ].join("\n    "))
    expect(readYaml("Справочник/СправочникВладелец/Свойства.yaml"))
      .toContain("ФормаВыбора: ФормаВыбора")
  })

  it("разрешает предопределённое значение по общему индексу другого работника", () => {
    const exchangePlanPath = "ПланОбмена/ПланОбменаВсеСвойства/Свойства.yaml"
    const catalogPath = "Справочник/СправочникРеквизит/Свойства.yaml"
    const exchangePlan = readYaml(exchangePlanPath)

    expect(workerFor(exchangePlanPath)).not.toBe(workerFor(catalogPath))
    expect(exchangePlan).toContain(
      "ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение",
    )
    expect(exchangePlan).not.toContain(
      "ЗначениеЗаполнения: !xml/value Справочник.СправочникРеквизит.ПредопредленноеЗначение",
    )
  })
})

function readYaml(relativePath: string): string {
  return fs.readFileSync(join(projectDir, "cf", relativePath), "utf8")
}

function workerFor(targetProjectPath: string): number {
  for (let workerIndex = 0; workerIndex < workerCount; workerIndex += 1) {
    const assigned = importWorkerPool.commands(workerIndex).some((command) =>
      command.kind === "firstPassBatch"
      && command.assignments.some((assignment) => assignment.targetProjectPath === targetProjectPath)
    )
    if (assigned) return workerIndex
  }
  throw new Error(`Не найден работник для ${targetProjectPath}`)
}

function copyRepresentativeFixtures(): void {
  for (const relativePath of [
    "Configuration.xml",
    "Languages/Русский.xml",
    "CommonForms/Команды.xml",
    "CommonForms/Команды",
    "CommonForms/Форма.xml",
    "CommonForms/Форма",
    "Tasks/ЗадачаВсеСвойства.xml",
    "Tasks/ЗадачаВсеСвойства",
    "Catalogs/СправочникВладелец.xml",
    "Catalogs/СправочникВладелец",
    "Catalogs/СправочникПолный.xml",
    "Catalogs/СправочникРеквизит.xml",
    "Catalogs/СправочникРеквизит",
    "ExchangePlans/ПланОбменаВсеСвойства.xml",
    "ExchangePlans/ПланОбменаВсеСвойства",
    "FunctionalOptions/ФункциональнаяОпцияБулево.xml",
    "InformationRegisters/ЗначенияХарактеристикОбъектов.xml",
  ]) {
    const source = join(sourceInputDir, relativePath)
    const target = join(inputDir, relativePath)
    fs.mkdirSync(join(target, ".."), { recursive: true })
    fs.cpSync(source, target, { recursive: true })
  }
  const configurationPath = join(inputDir, "Configuration.xml")
  const configuration = fs.readFileSync(configurationPath, "utf8")
  const childObjects = [
    ["Language", "Русский"],
    ["ExchangePlan", "ПланОбменаВсеСвойства"],
    ["FunctionalOption", "ФункциональнаяОпцияБулево"],
    ["CommonForm", "Команды"],
    ["CommonForm", "Форма"],
    ["Catalog", "СправочникПолный"],
    ["Catalog", "СправочникВладелец"],
    ["Catalog", "СправочникРеквизит"],
    ["Task", "ЗадачаВсеСвойства"],
    ["InformationRegister", "ЗначенияХарактеристикОбъектов"],
  ].map(([kind, name]) => `\t\t\t<${kind}>${name}</${kind}>`).join("\n")
  fs.writeFileSync(
    configurationPath,
    configuration.replace(
      /\t\t<ChildObjects>[\s\S]*?\t\t<\/ChildObjects>/u,
      `\t\t<ChildObjects>\n${childObjects}\n\t\t</ChildObjects>`,
    ),
  )
}
