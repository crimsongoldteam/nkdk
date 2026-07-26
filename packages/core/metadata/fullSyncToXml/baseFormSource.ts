import fs from "node:fs"
import { join } from "node:path"
import { hashFileBytes } from "../configurationIndex/hash"
import { prepareYamlFiles } from "../project/prepareYamlFiles"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { classifyMetadataProjectPath } from "../resourceTopology/projectProjection"
import type {
  ComponentHashState,
  ComponentProjectStructure,
} from "../project/componentState/types"
import type { FullXmlSyncAssignment } from "./types"

export interface BaseFormSource {
  read(params: {
    readonly extensionAssignment: FullXmlSyncAssignment
    readonly baseProjectPath: string
  }): Promise<PreparedYamlFile>
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
}): BaseFormSource {
  if (params.baseStructure.componentPath !== params.baseHashes.componentPath) {
    throw new Error("Структура и хэши базовой формы относятся к разным компонентам")
  }
  const hashes = new Map(
    params.baseHashes.projectFiles.map(({ projectPath, contentHash }) => [
      projectPath,
      contentHash,
    ])
  )

  return {
    async read({ extensionAssignment, baseProjectPath }) {
      const resource = classifyMetadataProjectPath(
        params.baseStructure.topology,
        baseProjectPath
      )
      if (
        resource?.kind !== "content" ||
        resource.role !== "fileItem" ||
        !params.baseStructure.projectPaths.includes(baseProjectPath)
      ) {
        throw new Error(`Путь не является формой основной конфигурации: ${baseProjectPath}`)
      }
      const expectedHash = hashes.get(baseProjectPath)
      if (expectedHash === undefined) {
        throw new Error(`Для базовой формы отсутствует подтверждённый хэш: ${baseProjectPath}`)
      }
      const sourcePath = join(
        params.baseStructure.componentDir,
        ...baseProjectPath.split("/")
      )
      const bytes = await fs.promises.readFile(sourcePath)
      if (hashFileBytes(bytes) !== expectedHash) {
        throw new BaseFormSourceError(
          `Базовая YAML-форма изменена после получения хэшей: ${baseProjectPath}`
        )
      }
      const prepared = prepareYamlFiles({
        files: [{
          projectPath: baseProjectPath,
          filePath: sourcePath,
          role: "form",
          owner: ownerFromPath(baseProjectPath, extensionAssignment.itemName),
          itemType: extensionAssignment.itemType,
        }],
        itemTypeByYamlDir: {},
        sourceBytes: new Map([[sourcePath, bytes]]),
      })
      const file = prepared.yamlFiles[0]
      if (file === undefined) {
        throw new Error(`Не удалось подготовить базовую YAML-форму: ${baseProjectPath}`)
      }
      if (file.syntaxDiagnostics.some(({ severity }) => severity === "error")) {
        throw new Error(`Синтаксическая ошибка базовой YAML-формы: ${baseProjectPath}`)
      }
      return file
    },
  }
}

function ownerFromPath(
  projectPath: string,
  fallbackName: string
): { dir: string; name: string } {
  const parts = projectPath.split("/")
  return { dir: parts[0] ?? "", name: parts[1] ?? fallbackName }
}
