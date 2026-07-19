import { existsSync, statSync } from "fs"
import { resolve } from "path"
import { loadCoreApi, type MetadataProjectDirectoryStructure } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { DescribeProjectStructureInput } from "../contracts/describeProjectStructure"

type DescribeProjectStructureSuccess = MetadataProjectDirectoryStructure & Record<string, unknown>

export type DescribeProjectStructurePayload = ToolPayload<DescribeProjectStructureSuccess>

const invalidArgumentMessages = new Set([
  "Каталог находится вне указанного YAML-проекта",
  "Каталог не соответствует структуре metadata-проекта",
  "depth должен быть положительным целым числом",
])

export async function describeProjectStructure(
  input: DescribeProjectStructureInput,
): Promise<DescribeProjectStructurePayload> {
  const projectDir = resolve(input.projectDir)

  if (!existsSync(projectDir)) {
    return toolError("not_found", "YAML-проект не найден", { projectDir: input.projectDir })
  }

  if (!statSync(projectDir).isDirectory()) {
    return toolError("invalid_arguments", "Путь не является каталогом YAML-проекта", { projectDir: input.projectDir })
  }

  try {
    const core = await loadCoreApi()
    const structure = core.describeMetadataProjectDirectoryStructure({
        projectDir,
        ...(input.directoryPath !== undefined ? { directoryPath: input.directoryPath } : {}),
        ...(input.depth !== undefined ? { depth: input.depth } : {}),
      })
    return toolSuccess({ ...structure } as DescribeProjectStructureSuccess)
  } catch (caught) {
    if (caught instanceof Error && invalidArgumentMessages.has(caught.message)) {
      return toolError("invalid_arguments", caught.message)
    }
    return toolError("core_error", errorMessage(caught))
  }
}
