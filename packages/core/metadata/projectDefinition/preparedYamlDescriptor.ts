import type { MetadataProjectResourceRef } from "./resources"
import type { PreparedYamlProjectFileDescriptor } from "./preparedYamlContracts"

export function toPreparedYamlProjectFileDescriptor(
  resource: MetadataProjectResourceRef,
  component: { componentPath: string; componentDir: string },
): PreparedYamlProjectFileDescriptor {
  if (resource.absolutePath === undefined || resource.kind !== "yaml") {
    throw new Error(`Expected a project YAML file: ${resource.projectPath}`)
  }
  return {
    componentPath: component.componentPath,
    componentDir: component.componentDir,
    rootProjectPath: `${component.componentPath}/${resource.projectPath}`,
    projectPath: resource.projectPath,
    filePath: resource.absolutePath,
    role: resource.role,
    ...(resource.role === "form" && resource.indexContribution !== undefined
      ? { indexContribution: resource.indexContribution }
      : {}),
    owner: { dir: resource.owner.dir, name: resource.owner.name },
    itemType:
      resource.owner.spec.rule.metadataTargetOwner?.kind === "self"
        ? resource.owner.spec.rule.metadataTargetOwner.root
        : (resource.owner.spec.rule.itemTypePrefix ?? resource.owner.spec.rule.itemType),
  }
}
