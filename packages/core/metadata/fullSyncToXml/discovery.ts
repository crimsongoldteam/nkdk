import type {
  ComponentHashState,
  ComponentProjectStructure,
} from "../project/componentState/types"
import { hashConfigurationProjectFileList } from "../configurationIndex"
import { discoverMetadataProjectResources } from "../resourceTopology/projectProjection"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/registry"
import { buildXmlSyncPlan } from "./selection"
import type { FullXmlSyncPlan } from "./types"

export function buildFullXmlSyncPlan(params: {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
}): FullXmlSyncPlan {
  return buildXmlSyncPlan({
    structure: params.structure,
    hashes: params.hashes,
    selection: { kind: "all" },
  })
}

export async function discoverFullXmlSyncPlan(componentDir: string): Promise<FullXmlSyncPlan> {
  const topology = compileRegisteredMetadataResourceTopology()
  const resources = await discoverMetadataProjectResources({ topology, projectDir: componentDir })
  const projectPaths = resources.map(({ projectPath }) => projectPath)
  const structure: ComponentProjectStructure = {
    address: { kind: "configuration" },
    componentPath: "cf",
    componentDir,
    topology,
    resources,
    projectPaths,
  }
  return buildFullXmlSyncPlan({
    structure,
    hashes: {
      componentPath: "cf",
      projectFiles: await hashConfigurationProjectFileList(componentDir, projectPaths),
    },
  })
}
