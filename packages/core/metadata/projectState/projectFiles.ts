import { toPreparedYamlProjectFileDescriptor, type PreparedYamlProjectFileDescriptor } from "../project/preparedYamlProject"
import { discoverMetadataProjectResources } from "../project/resources"
import { discoverValidationProjectComponents } from "../validation/projectComponents"
import type { ProjectStateFileIdentity } from "./fileUpdate"

export interface ProjectStateValidationFile {
  readonly identity: ProjectStateFileIdentity
  readonly absolutePath: string
  readonly descriptor?: PreparedYamlProjectFileDescriptor
}

export async function discoverProjectStateValidationFiles(
  projectDir: string,
): Promise<readonly ProjectStateValidationFile[]> {
  const { components } = await discoverValidationProjectComponents(projectDir)
  const files = await Promise.all(components.map(async (component) => {
    const resources = await discoverMetadataProjectResources(component.componentDir, { include: "all" }, component)
    return resources.flatMap((resource): ProjectStateValidationFile[] => {
      if (resource.absolutePath === undefined) return []
      const identity: ProjectStateFileIdentity = {
        projectPath: `${component.componentPath}/${resource.projectPath}`,
        componentPath: component.componentPath,
        resourceKind: resource.kind,
        ...(resource.kind === "yaml" ? { yamlRole: resource.role } : {}),
      }
      return [{
        identity,
        absolutePath: resource.absolutePath,
        ...(resource.kind === "yaml"
          ? { descriptor: toPreparedYamlProjectFileDescriptor(resource, component) }
          : {}),
      }]
    })
  }))
  return files.flat().sort((left, right) =>
    left.identity.projectPath.localeCompare(right.identity.projectPath, "ru"))
}
