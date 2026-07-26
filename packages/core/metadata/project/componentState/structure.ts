import { resolve } from "path"
import { componentPath, type ComponentAddress } from "../../components/address"
import { discoverMetadataProjectResources } from "../../resourceTopology/projectProjection"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/registry"
import type { CompiledMetadataResourceTopology } from "../../resourceTopology/types"
import type { ComponentProjectStructure } from "./types"

export async function readComponentProjectStructure(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly topology?: CompiledMetadataResourceTopology
}): Promise<ComponentProjectStructure> {
  const path = componentPath(params.address)
  const componentDir = resolve(params.projectDir, ...path.split("/"))
  const topology = params.topology ?? compileRegisteredMetadataResourceTopology()
  const resources = await discoverMetadataProjectResources({
    topology,
    projectDir: componentDir,
  })

  return {
    address: params.address,
    componentPath: path,
    componentDir,
    topology,
    resources,
    projectPaths: resources.map(({ projectPath }) => projectPath),
  }
}
