import { componentPath, type ComponentAddress } from "@nkdk/runtime"
import {
  configurationIndexStoreDescriptor,
  createLocalConfigurationIndexReader,
} from "../configurationIndex"
import {
  openConfigurationIndexStore,
  type ConfigurationIndexStore,
} from "../configurationIndex/store"
import { collectComponentLogicalAddresses } from "../project/componentState/logicalAddresses"
import { readComponentProjectStructure } from "../project/componentState/structure"
import {
  buildXmlComponentReconstructionProfile,
  type XmlComponentReconstructionProfile,
} from "../project/xmlReconstructionProfile"
import {
  cloneProjectStateReadToken,
  type ProjectStateReadToken,
  type ProjectStateService,
} from "../projectState"
import { projectXmlExportAssignment } from "../resourceTopology/core/xmlExportProjection"
import type { ImportAssignment } from "./types"

export interface ImportXmlReconstructionProfileDependencies {
  readonly readBaseStructure: typeof readComponentProjectStructure
  readonly openBaseIndex: typeof openConfigurationIndexStore
  readonly buildProfile: typeof buildXmlComponentReconstructionProfile
}

const defaultDependencies: ImportXmlReconstructionProfileDependencies = {
  readBaseStructure: readComponentProjectStructure,
  openBaseIndex: openConfigurationIndexStore,
  buildProfile: buildXmlComponentReconstructionProfile,
}

export async function prepareImportXmlReconstructionProfile(params: {
  readonly address: ComponentAddress
  readonly projectDir: string
  readonly assignments: readonly ImportAssignment[]
  readonly projectState: Pick<ProjectStateService, "openReadSession">
  readonly projectStateReadToken: ProjectStateReadToken
  readonly targetIndex: Pick<ConfigurationIndexStore, "getBlocks">
}, dependencyOverrides: Partial<ImportXmlReconstructionProfileDependencies> = {}): Promise<XmlComponentReconstructionProfile> {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides }
  const projectStateReadSession = params.projectState.openReadSession(
    cloneProjectStateReadToken(params.projectStateReadToken),
  )
  try {
    const targetAddresses = collectComponentLogicalAddresses({
      componentPath: componentPath(params.address),
      known: params.assignments.map(({ logicalAddress, targetProjectPath }) => ({
        logicalAddress,
        sourceProjectPath: targetProjectPath,
      })),
      projectStateReadSession,
    })
    const target = {
      logicalAddresses: targetAddresses.map(({ logicalAddress }) => logicalAddress),
      index: createLocalConfigurationIndexReader(
        params.targetIndex.getBlocks(uniqueProjectPaths(targetAddresses)),
      ),
    }

    if (params.address.kind === "configuration") {
      return dependencies.buildProfile({ componentKind: "configuration", target })
    }
    if (params.address.kind !== "configurationExtension") {
      throw new Error(`Профиль восстановления XML не поддерживает компонент: ${params.address.kind}`)
    }

    const baseStructure = await dependencies.readBaseStructure({
      projectDir: params.projectDir,
      address: { kind: "configuration" },
    })
    const baseAddresses = collectComponentLogicalAddresses({
      componentPath: baseStructure.componentPath,
      known: baseStructure.resources
        .filter(({ kind }) => kind === "content")
        .map((resource) => ({
          logicalAddress: projectXmlExportAssignment(baseStructure.topology, resource).logicalAddress,
          sourceProjectPath: resource.projectPath,
        })),
      projectStateReadSession,
    })
    const baseIndex = dependencies.openBaseIndex(
      configurationIndexStoreDescriptor(params.projectDir, { kind: "configuration" }),
      "readOnly",
    )
    try {
      return dependencies.buildProfile({
        componentKind: "configurationExtension",
        target,
        base: {
          logicalAddresses: baseAddresses.map(({ logicalAddress }) => logicalAddress),
          index: createLocalConfigurationIndexReader(
            baseIndex.getBlocks(uniqueProjectPaths(baseAddresses)),
          ),
        },
      })
    } finally {
      await baseIndex.close()
    }
  } finally {
    projectStateReadSession.close()
  }
}

function uniqueProjectPaths(entries: readonly { readonly sourceProjectPath: string }[]): string[] {
  return [...new Set(entries.map(({ sourceProjectPath }) => sourceProjectPath))]
}
