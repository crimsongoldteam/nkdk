import { assertCoreMetadataRegistered } from "../projectDefinition/projectSpecRegistry"
import { discoverMetadataProjectResources } from "../resourceTopology/core/projectProjection"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"

export async function collectSyncStateFilePaths(projectDir: string): Promise<string[]> {
  assertCoreMetadataRegistered("project/syncStateFiles")
  const resources = await discoverMetadataProjectResources({
    topology: compileRegisteredMetadataResourceTopology(),
    projectDir,
    includeSyncStateIgnored: true,
  })
  return resources.map((resource) => resource.projectPath).sort((left, right) => left.localeCompare(right, "ru"))
}
