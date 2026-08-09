import { toPreparedYamlProjectFileDescriptor } from "../project/preparedYamlDescriptor"
import type { PreparedYamlProjectFileDescriptor } from "../project/preparedYamlContracts"
import {
  discoverMetadataProjectResources,
  iterateMetadataProjectResourceCandidates,
  projectStateFileBackedTargets,
  type MetadataProjectResourceRef,
} from "../project/resources"
import { discoverValidationProjectComponents } from "../validation/projectComponents"
import type { ProjectStateFileIdentity } from "./fileUpdate"
import type { ProjectStateTargetEntry } from "./fileUpdate"

export interface ProjectStateValidationFile {
  readonly identity: ProjectStateFileIdentity
  readonly absolutePath: string
  readonly targets: readonly ProjectStateTargetEntry[]
  readonly descriptor?: PreparedYamlProjectFileDescriptor
}

export interface ProjectStateDiscoveredFileBatch {
  readonly paths: readonly ProjectStateDiscoveredPath[]
}

export interface ProjectStateDiscoveredPath {
  readonly projectPath: string
  readonly componentPath: string
  readonly absolutePath: string
  classify(): ProjectStateValidationFile | undefined
}

export interface ProjectStateValidationFileTask {
  readonly projectPath: string
  readonly componentPath: string
  readonly absolutePath: string
  readonly identity?: ProjectStateFileIdentity
  readonly descriptor?: PreparedYamlProjectFileDescriptor
  readonly targets?: readonly ProjectStateTargetEntry[]
}

export const PROJECT_STATE_VALIDATION_BATCH_SIZE = 256

export async function* discoverProjectStateValidationFileBatches(
  projectDir: string,
  batchSize = PROJECT_STATE_VALIDATION_BATCH_SIZE,
): AsyncGenerator<ProjectStateDiscoveredFileBatch> {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new Error("Размер пачки должен быть положительным целым")
  const { components } = await discoverValidationProjectComponents(projectDir)
  let batch: ProjectStateDiscoveredPath[] = []
  for (const component of components) {
    for await (const candidate of iterateMetadataProjectResourceCandidates(
      component.componentDir,
      { include: "all" },
      component,
    )) {
      let classified = false
      let cached: ProjectStateValidationFile | undefined
      batch.push({
        projectPath: `${component.componentPath}/${candidate.projectPath}`,
        componentPath: component.componentPath,
        absolutePath: candidate.absolutePath,
        classify() {
          if (!classified) {
            const resource = candidate.classify()
            cached = resource === undefined ? undefined : toValidationFile(component.componentPath, resource, component)
            classified = true
          }
          return cached
        },
      })
      if (batch.length < batchSize) continue
      yield toDiscoveredBatch(batch)
      batch = []
    }
  }
  if (batch.length > 0) yield toDiscoveredBatch(batch)
}

export async function discoverProjectStateValidationFiles(
  projectDir: string,
): Promise<readonly ProjectStateValidationFile[]> {
  const { components } = await discoverValidationProjectComponents(projectDir)
  const files = await Promise.all(components.map(async (component) => {
    const resources = await discoverMetadataProjectResources(component.componentDir, { include: "all" }, component)
    return resources.flatMap((resource): ProjectStateValidationFile[] => {
      if (resource.absolutePath === undefined) return []
      return [toValidationFile(component.componentPath, resource, component)]
    })
  }))
  return files.flat().sort((left, right) =>
    left.identity.projectPath.localeCompare(right.identity.projectPath, "ru"))
}

function toValidationFile(
  componentPath: string,
  resource: MetadataProjectResourceRef,
  component: Parameters<typeof toPreparedYamlProjectFileDescriptor>[1],
): ProjectStateValidationFile {
  const identity: ProjectStateFileIdentity = {
    projectPath: `${componentPath}/${resource.projectPath}`,
    componentPath,
    resourceKind: resource.kind,
    ...(resource.kind === "yaml" ? { yamlRole: resource.role } : {}),
  }
  return {
    identity,
    absolutePath: resource.absolutePath!,
    targets: projectStateFileBackedTargets(componentPath, resource.fileBackedTargets),
    ...(resource.kind === "yaml"
      ? { descriptor: toPreparedYamlProjectFileDescriptor(resource, component) }
      : {}),
  }
}

function toDiscoveredBatch(paths: readonly ProjectStateDiscoveredPath[]): ProjectStateDiscoveredFileBatch {
  return { paths }
}
