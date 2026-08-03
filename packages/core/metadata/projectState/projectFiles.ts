import { toPreparedYamlProjectFileDescriptor, type PreparedYamlProjectFileDescriptor } from "../project/preparedYamlProject"
import { discoverMetadataProjectResources, iterateMetadataProjectResources } from "../project/resources"
import { discoverValidationProjectComponents } from "../validation/projectComponents"
import type { ProjectStateFileIdentity } from "./fileUpdate"

export interface ProjectStateValidationFile {
  readonly identity: ProjectStateFileIdentity
  readonly absolutePath: string
  readonly descriptor?: PreparedYamlProjectFileDescriptor
}

export interface ProjectStateDiscoveredFileBatch {
  readonly files: readonly ProjectStateValidationFile[]
}

export async function* discoverProjectStateValidationFileBatches(
  projectDir: string,
  batchSize = 32,
): AsyncGenerator<ProjectStateDiscoveredFileBatch> {
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new Error("Размер пачки должен быть положительным целым")
  const { components } = await discoverValidationProjectComponents(projectDir)
  let batch: ProjectStateValidationFile[] = []
  for (const component of components) {
    for await (const resource of iterateMetadataProjectResources(component.componentDir, { include: "all" }, component)) {
      if (resource.absolutePath === undefined) continue
      batch.push(toValidationFile(component.componentPath, resource, component))
      if (batch.length < batchSize) continue
      yield { files: batch }
      batch = []
    }
  }
  if (batch.length > 0) yield { files: batch }
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
  resource: Awaited<ReturnType<typeof discoverMetadataProjectResources>>[number],
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
    ...(resource.kind === "yaml"
      ? { descriptor: toPreparedYamlProjectFileDescriptor(resource, component) }
      : {}),
  }
}
