import { registerCoreMetadata } from "../register"
import { discoverMetadataProjectResources } from "../resourceTopology/projectProjection"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"

export async function collectSyncStateFilePaths(projectDir: string): Promise<string[]> {
  registerCoreMetadata()
  const resources = await discoverMetadataProjectResources({
    topology: compileRegisteredMetadataResourceTopology(),
    projectDir,
  })
  return resources.map((resource) => resource.projectPath).sort((left, right) => left.localeCompare(right, "ru"))
}
