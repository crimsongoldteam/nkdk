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

const inputDir = join(import.meta.dirname, "../../../../e2e/fixtures/xml/cf")
const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-russian-metadata-references-"))
const importWorkerPool = createInspectableXmlImportWorkerTestPool(4)
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
  importResult = await withMetadataExecutionRegistrySets(registries, () => importConfigurationFromXml({
    context: mockContextFromXML(),
    inputDir,
    projectDir,
    concurrency: 4,
    operationId: "russian-metadata-references",
    xmlImportWorkerPoolHandle,
    projectState,
  }))
}, 120_000)

afterAll(async () => {
  await xmlImportWorkerPoolHandle.close()
  await projectState.close()
  fs.rmSync(projectDir, { recursive: true, force: true })
})

describe("Russian metadata references XML import", () => {
  it("imports representative metadata references in Russian form", () => {
    expect(importResult.failed).toEqual([])

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
      "ЗначениеЗаполнения: !xml Справочник.СправочникРеквизит.ПредопредленноеЗначение",
    )
  })
})

function readYaml(relativePath: string): string {
  return fs.readFileSync(join(projectDir, "cf", relativePath), "utf8")
}

function workerFor(targetProjectPath: string): number {
  for (let workerIndex = 0; workerIndex < 4; workerIndex += 1) {
    const assigned = importWorkerPool.commands(workerIndex).some((command) =>
      command.kind === "firstPassBatch"
      && command.assignments.some((assignment) => assignment.targetProjectPath === targetProjectPath)
    )
    if (assigned) return workerIndex
  }
  throw new Error(`Не найден работник для ${targetProjectPath}`)
}
