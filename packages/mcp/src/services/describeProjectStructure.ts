import { loadCoreApi, type MetadataProjectDirectoryStructure } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { DescribeProjectStructureInput } from "../contracts/describeProjectStructure"
import { resolveComponent, resolveStructurePath } from "./componentResolver"

type DescribeProjectStructureSuccess = MetadataProjectDirectoryStructure & Record<string, unknown>

export type DescribeProjectStructurePayload = ToolPayload<DescribeProjectStructureSuccess>

const invalidArgumentMessages = new Set([
  "Каталог находится вне указанного YAML-проекта",
  "Каталог не соответствует структуре metadata-проекта",
  "depth должен быть положительным целым числом",
  "structurePath должен быть относительным путем",
  "structurePath должен находиться внутри компонента",
])

export async function describeProjectStructure(
  input: DescribeProjectStructureInput,
  deps?: {
    describeMetadataProjectDirectoryStructure: (params: {
      projectDir: string
      directoryPath?: string
      depth?: number
    }) => MetadataProjectDirectoryStructure
  },
): Promise<DescribeProjectStructurePayload> {
  try {
    const component = resolveComponent({ projectDir: input.projectDir, componentPath: input.componentPath })
    if (!component.ok) return component.error

    const structurePath = resolveStructurePath(component.componentDir, input.structurePath)
    const core = deps ?? (await loadCoreApi())
    const structure = core.describeMetadataProjectDirectoryStructure({
        projectDir: component.componentDir,
        ...(structurePath !== undefined ? { directoryPath: structurePath } : {}),
        ...(input.depth !== undefined ? { depth: input.depth } : {}),
      })
    return toolSuccess({
      ...structure,
      projectDir: component.projectDir,
      componentPath: component.componentPath,
      structurePath: structure.directoryPath,
    } as DescribeProjectStructureSuccess)
  } catch (caught) {
    if (caught instanceof Error && invalidArgumentMessages.has(caught.message)) {
      return toolError("invalid_arguments", caught.message)
    }
    return toolError("core_error", errorMessage(caught))
  }
}
