import { resolve } from "path"
import { componentPath, type ComponentAddress } from "@nkdk/runtime"
import { discoverMetadataProjectResources } from "../../resourceTopology/core/projectProjection"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/adapters/registeredRules"
import type { CompiledMetadataResourceTopology } from "@nkdk/runtime/rule-kit"
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
