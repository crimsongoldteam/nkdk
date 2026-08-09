import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { valueSymbol } from "piscina"
import { writeConfigurationIndex, configurationIndexPath } from "../../configurationIndex/fileIO"
import type { ConfigurationSnapshotEntity } from "../../configurationIndex/types"
import { createDefaultProjectStateService } from "../../projectState/createDefaultService"
import type { ProjectStateService } from "../../projectState/service"
import { createMetadataWorkerPoolHandle } from "../../workerPool/handle"
import { createMetadataWorkerCommandHandler } from "../../workerPool/worker"
import type { MetadataWorkerCommandResult } from "../../workerPool/types"
import {
  preparePartialXmlSyncPackage,
  type PreparePartialXmlSyncPackageResult,
} from "../preparePartialXmlSyncPackage"
import {
  readComponentHashState,
  readComponentIndexes,
  readComponentProjectStructure,
} from "../../project/componentState"

export const FORM_PATH = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
export const MODULE_PATH = "Справочник/Товары/МодульОбъекта.bsl"

export function createPartialSyncTestProjectState(): ProjectStateService {
  return createDefaultProjectStateService({
    workerPool: createMetadataWorkerPoolHandle({
      createLine() {
        const run = createMetadataWorkerCommandHandler()
        return {
          async run(command) {
            const result = await run(command)
            return result !== undefined && typeof result === "object" && valueSymbol in result
              ? unwrapPiscinaResult(result)
              : result
          },
          async destroy() {},
        }
      },
    }),
  })
}

export async function createPartialSyncTestProject(
  sharedProjectState?: ProjectStateService,
) {
  const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-partial-sync-integration-"))
  write(projectDir, "cf/Конфигурация.yaml", [
    "Имя: Конфигурация",
    'Синоним: ""',
    "ОсновнойЯзык: Русский",
    "ИнтерфейсКлиентскогоПриложения: {}",
    "",
  ].join("\n"))
  write(projectDir, "cf/Язык/Русский/Свойства.yaml", "КодЯзыка: ru\n")
  write(projectDir, "cf/Справочник/Товары/Свойства.yaml", "Комментарий: Тестовый справочник\n")
  write(projectDir, `cf/${FORM_PATH}`, "Реквизиты: {}\n")
  write(projectDir, `cf/${MODULE_PATH}`, "Процедура ПриОткрытии()\nКонецПроцедуры\n")

  const projectState = sharedProjectState ?? createPartialSyncTestProjectState()
  const context = { version: "2.20", defaultLanguage: "ru" } as const
  const refreshed = await projectState.refreshAndValidate({ projectDir, context })
  const diagnostics = [...refreshed.diagnostics]
  refreshed.diagnostics.release()
  if (diagnostics.some(({ severity }) => severity === "error")) {
    throw new Error(`Тестовый проект не прошёл валидацию: ${diagnostics.map(({ message }) => message).join("; ")}`)
  }
  const structure = await readComponentProjectStructure({
    projectDir,
    address: { kind: "configuration" },
  })
  const projection = await projectState.readComponentProjection({ projectDir, componentPath: "cf" })
  const hashes = await readComponentHashState({ structure, projection })
  const session = projectState.openReadSession(refreshed.readToken)
  const indexes = await readComponentIndexes({ structure, hashes, projectStateReadSession: session })
  session.close()
  const entities = indexes.logicalAddresses.map((entry, index): ConfigurationSnapshotEntity => ({
    ...entry,
    identities: { uuid: testUuid(index + 1) },
  }))
  await writeConfigurationIndex({
    projectDir,
    address: { kind: "configuration" },
    data: {
      specificationVersion: "1.3",
      indexGeneration: 1n,
      componentPath: "cf",
      files: hashes.projectFiles,
      entities,
    },
  })

  return {
    projectDir,
    projectState,
    context,
    indexPath: configurationIndexPath(projectDir, { kind: "configuration" }),
    write(projectPath: string, content: string) { write(projectDir, `cf/${projectPath}`, content) },
    remove(projectPath: string) { fs.rmSync(join(projectDir, "cf", ...projectPath.split("/")), { force: true }) },
    async close() {
      if (sharedProjectState === undefined) await projectState.close()
      fs.rmSync(projectDir, { recursive: true, force: true })
    },
  }
}

export type PartialSyncTestProject = Awaited<ReturnType<typeof createPartialSyncTestProject>>
export type PreparedPartialSyncTestPackage = Extract<PreparePartialXmlSyncPackageResult, { status: "prepared" }>

export async function preparePartialSyncTestPackage(
  project: PartialSyncTestProject,
): Promise<PreparedPartialSyncTestPackage> {
  const result = await preparePartialXmlSyncPackage({
    context: project.context,
    projectDir: project.projectDir,
    componentPath: "cf",
    projectState: project.projectState,
  })
  if (!result.ok || result.status !== "prepared") {
    throw new Error(`Пакет не подготовлен: ${result.diagnostics.map(({ message }) => message).join("; ")}`)
  }
  return result
}

function write(projectDir: string, projectPath: string, content: string): void {
  const path = join(projectDir, ...projectPath.split("/"))
  fs.mkdirSync(join(path, ".."), { recursive: true })
  fs.writeFileSync(path, content)
}

function testUuid(value: number): string {
  return `00000000-0000-4000-8000-${value.toString(16).padStart(12, "0")}`
}

function unwrapPiscinaResult(value: object): MetadataWorkerCommandResult {
  return Reflect.get(value, valueSymbol) as MetadataWorkerCommandResult
}
