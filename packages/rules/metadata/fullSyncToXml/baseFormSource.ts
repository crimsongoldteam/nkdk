import fs from "node:fs"
import { join } from "node:path"
import { hashFileBytes } from "@nkdk/runtime"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import type {
  ComponentHashState,
  ComponentProjectStructure,
} from "../project/componentState/types"
import type { FullXmlSyncAssignment } from "./types"

export interface BaseFormSource {
  read(params: {
    readonly extensionAssignment: FullXmlSyncAssignment
    readonly baseProjectPath: string
    readonly savedProjectPath?: string
  }): Promise<BaseFormSourceResult>
}

interface PreparedBaseFormSource {
  readonly prepared: PreparedYamlFile
  readonly projectPath: string
}

export type BaseFormSourceResult = {
  readonly kind: "saved" | "projected"
  readonly baseForm: PreparedBaseFormSource
  readonly currentConfigurationForm: PreparedBaseFormSource
}

export class BaseFormSourceError extends Error {
  readonly code: "full_xml_sync_base_form_changed"

  constructor(message: string) {
    super(message)
    this.code = "full_xml_sync_base_form_changed"
  }
}

export function createVerifiedBaseFormSource(params: {
  readonly baseStructure: ComponentProjectStructure
  readonly baseHashes: ComponentHashState
  readonly savedStructure?: ComponentProjectStructure
  readonly savedHashes?: ComponentHashState
}): BaseFormSource {
  const base = verifiedComponent(params.baseStructure, params.baseHashes)
  const saved = params.savedStructure === undefined || params.savedHashes === undefined
    ? undefined
    : verifiedComponent(params.savedStructure, params.savedHashes)

  return {
    async read({ extensionAssignment, baseProjectPath, savedProjectPath }) {
      if (savedProjectPath !== undefined) {
        if (saved === undefined) {
          throw new Error(`Для сохранённой основы отсутствует подтверждённое состояние: ${savedProjectPath}`)
        }
        const [savedPrepared, currentPrepared] = await Promise.all([
          readVerifiedYaml(saved, savedProjectPath, extensionAssignment),
          readVerifiedYaml(base, baseProjectPath, extensionAssignment),
        ])
        return {
          kind: "saved",
          baseForm: { prepared: savedPrepared, projectPath: savedProjectPath },
          currentConfigurationForm: { prepared: currentPrepared, projectPath: baseProjectPath },
        }
      }
      const prepared = await readVerifiedYaml(base, baseProjectPath, extensionAssignment)
      const currentConfigurationForm = { prepared, projectPath: baseProjectPath }
      return {
        kind: "projected",
        baseForm: currentConfigurationForm,
        currentConfigurationForm,
      }
    },
  }
}

function verifiedComponent(
  structure: ComponentProjectStructure,
  hashes: ComponentHashState,
): { readonly structure: ComponentProjectStructure; readonly hashes: ReadonlyMap<string, bigint> } {
  if (structure.componentPath !== hashes.componentPath) {
    throw new Error("Структура и хэши формы относятся к разным компонентам")
  }
  return {
    structure,
    hashes: new Map(hashes.projectFiles.map(({ projectPath, contentHash }) => [projectPath, contentHash])),
  }
}

async function readVerifiedYaml(
  component: ReturnType<typeof verifiedComponent>,
  projectPath: string,
  extensionAssignment: FullXmlSyncAssignment,
): Promise<PreparedYamlFile> {
  const resource = classifyMetadataProjectPath(component.structure.topology, projectPath)
  if (
    (resource?.kind !== "content" && resource?.kind !== "yamlCompanion") ||
    resource.assignment === undefined ||
    !component.structure.projectPaths.includes(projectPath)
  ) {
    throw new Error(`Путь не является подтверждённым ресурсом формы: ${projectPath}`)
  }
  const expectedHash = component.hashes.get(projectPath)
  if (expectedHash === undefined) {
    throw new Error(`Для базовой формы отсутствует подтверждённый хэш: ${projectPath}`)
  }
  const sourcePath = join(component.structure.componentDir, ...projectPath.split("/"))
  const baseAssignment = resource.assignment
  const bytes = await fs.promises.readFile(sourcePath)
  if (hashFileBytes(bytes) !== expectedHash) {
    throw new BaseFormSourceError(`Базовая YAML-форма изменена после получения хэшей: ${projectPath}`)
  }
  const prepared = prepareYamlFiles({
    files: [{
      projectPath,
      filePath: sourcePath,
      role:
        resource.kind === "yamlCompanion" || baseAssignment.role === "fileItem"
          ? "form"
          : baseAssignment.role,
      owner: ownerFromPath(projectPath, extensionAssignment.itemName),
      itemType: resource.rule?.itemType ?? baseAssignment.itemRule.itemType,
    }],
    itemTypeByYamlDir: {},
    sourceBytes: new Map([[sourcePath, bytes]]),
  })
  const file = prepared.yamlFiles[0]
  if (file === undefined) {
    throw new Error(`Не удалось подготовить базовую YAML-форму: ${projectPath}`)
  }
  if (file.syntaxDiagnostics.some(({ severity }) => severity === "error")) {
    throw new Error(`Синтаксическая ошибка базовой YAML-формы: ${projectPath}`)
  }
  return file
}

function ownerFromPath(
  projectPath: string,
  fallbackName: string
): { dir: string; name: string } {
  const parts = projectPath.split("/")
  return { dir: parts[0] ?? "", name: parts[1] ?? fallbackName }
}
