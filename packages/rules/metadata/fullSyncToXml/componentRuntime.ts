import type { ComponentAddress } from "@nkdk/runtime"
import type { ConfigurationContext } from "@nkdk/runtime"
import {
  confirmComponentState,
  readComponentHashState,
  readComponentIndexes,
  readComponentProjectStructure,
  type ConfirmedComponentState,
} from "../project/componentState"
import type {
  ProjectStateComponentProjection,
  ProjectStateReadToken,
  ProjectStateService,
} from "../projectState"
import type { FullXmlSyncComponentProfile } from "./componentProfile"

export interface FullXmlSyncComponentRuntimeDependencies {
  readonly readStructure: typeof readComponentProjectStructure
  readonly readSnapshot: typeof import("../configurationIndex").readConfigurationIndexSnapshot
  readonly readHashes: typeof readComponentHashState
  readonly readIndexes: typeof readComponentIndexes
  readonly confirmState: typeof confirmComponentState
}

export async function readProfileComponentStates(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly profile: FullXmlSyncComponentProfile
  readonly context: ConfigurationContext
  readonly concurrency?: number
  readonly projectState: ProjectStateService
  readonly projectStateReadToken: ProjectStateReadToken
  readonly projectStateIndexReadToken: ProjectStateReadToken
  readonly targetProjection: ProjectStateComponentProjection
  readonly deps: FullXmlSyncComponentRuntimeDependencies
}): Promise<{ readonly target: ConfirmedComponentState; readonly base?: ConfirmedComponentState }> {
  const projectStateReadSession = params.projectState.openReadSession(params.projectStateIndexReadToken)
  const common = {
    projectDir: params.projectDir,
    context: params.context,
    concurrency: params.concurrency,
    projectState: params.projectState,
    projectStateReadToken: params.projectStateReadToken,
    projectStateReadSession,
    deps: params.deps,
  }
  try {
    const target = await readConfirmedComponentState({
      ...common,
      address: params.address,
      projection: params.targetProjection,
    })
    const baseAddress = params.profile.baseAddress(params.address)
    const base = baseAddress === undefined
      ? undefined
      : await readConfirmedComponentState({ ...common, address: baseAddress })
    return { target, ...(base === undefined ? {} : { base }) }
  } finally {
    projectStateReadSession.close()
  }
}

async function readConfirmedComponentState(params: {
  readonly projectDir: string
  readonly address: ComponentAddress
  readonly context: ConfigurationContext
  readonly concurrency?: number
  readonly projectState: ProjectStateService
  readonly projectStateReadToken: ProjectStateReadToken
  readonly projectStateReadSession: Pick<import("../projectState").ProjectStateReadSession, "readComponentTargetPage">
  readonly projection?: ProjectStateComponentProjection
  readonly deps: FullXmlSyncComponentRuntimeDependencies
}): Promise<ConfirmedComponentState> {
  const structure = await params.deps.readStructure({
    projectDir: params.projectDir,
    address: params.address,
  })
  const snapshot = await params.deps.readSnapshot({
    projectDir: params.projectDir,
    address: params.address,
  })
  const projection = params.projection ?? await params.projectState.readComponentProjection({
    projectDir: params.projectDir,
    componentPath: structure.componentPath,
  })
  const hashes = await params.deps.readHashes({ structure, projection })
  const indexes = await params.deps.readIndexes({
    structure,
    hashes,
    projectStateReadSession: params.projectStateReadSession,
  })
  return params.deps.confirmState({
    structure,
    snapshot,
    hashes,
    indexes,
    projectStateReadToken: params.projectStateReadToken,
  })
}
