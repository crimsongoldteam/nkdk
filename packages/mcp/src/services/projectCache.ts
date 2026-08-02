import type { CoreProjectStateService, CoreProjectStateStats, Diagnostic } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { ProjectCacheInput } from "../contracts/projectCache"
import { resolveProjectRoot } from "./componentResolver"
import { projectStateHandle } from "./projectStateHandle"

interface ProjectCacheDeps {
  readonly projectState: CoreProjectStateService
}

export type ResetProjectCachePayload = ToolPayload<{ reset: true }>
export type RebuildProjectCachePayload = ToolPayload<{
  diagnostics: readonly Diagnostic[]
  stats: CoreProjectStateStats
}>

export async function resetProjectCache(
  input: ProjectCacheInput,
  deps?: ProjectCacheDeps,
): Promise<ResetProjectCachePayload> {
  const project = resolveProjectRoot(input.projectDir)
  if (!project.ok) return project.error
  try {
    const projectState = deps?.projectState ?? await projectStateHandle.get()
    await projectState.reset(project.projectDir)
    return toolSuccess({ reset: true as const })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}

export async function rebuildProjectCache(
  input: ProjectCacheInput,
  deps?: ProjectCacheDeps,
): Promise<RebuildProjectCachePayload> {
  const project = resolveProjectRoot(input.projectDir)
  if (!project.ok) return project.error
  try {
    const projectState = deps?.projectState ?? await projectStateHandle.get()
    const result = await projectState.rebuild({ projectDir: project.projectDir })
    return toolSuccess({ diagnostics: result.diagnostics, stats: result.stats })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
