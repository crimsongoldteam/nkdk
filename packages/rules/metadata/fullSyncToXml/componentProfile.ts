import type { ComponentAddress } from "@nkdk/runtime"
import type {
  ConfigurationProjectFile,
  ConfigurationIndexStoreDescriptor,
} from "../configurationIndex"
import type { ConfirmedComponentState } from "../project/componentState/types"
import type { XmlComponentExportProfile } from "../project/xmlReconstructionProfile"
import { currentOperationRegistrySet } from "../operations/operationExecutionContext"
import {
  createLocalConfigurationIndexReader,
  type LocalConfigurationIndexReader,
} from "../configurationIndex"
import { openConfigurationIndexStore } from "../configurationIndex/store"
import type { ConfigurationIndexStore } from "../configurationIndex/store"

export type XmlSyncProfileKind = "configuration" | "configurationExtension"

export interface FullXmlSyncWorkerProfileRuntime extends XmlComponentExportProfile {
  readonly kind: XmlSyncProfileKind
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
  readonly baseForms?: {
    readonly componentDir: string
    readonly projectFiles: readonly ConfigurationProjectFile[]
    readonly targetProjectFiles?: readonly ConfigurationProjectFile[]
    readonly snapshot: ConfigurationIndexStoreDescriptor
  }
}

export async function readConfirmedComponentIndex(
  state: ConfirmedComponentState,
  projectPaths = state.indexes.logicalAddresses.map(({ sourceProjectPath }) => sourceProjectPath),
  openStore: (
    descriptor: ConfigurationIndexStoreDescriptor,
    mode: "readOnly",
  ) => Pick<ConfigurationIndexStore, "getBlocks" | "close"> = openConfigurationIndexStore,
): Promise<LocalConfigurationIndexReader> {
  const store = openStore(state.snapshot.descriptor, "readOnly")
  try {
    return createLocalConfigurationIndexReader(store.getBlocks(projectPaths))
  } finally {
    await store.close()
  }
}

export interface FullXmlSyncProfileRuntime {
  readonly kind: XmlSyncProfileKind
  readonly target: ConfirmedComponentState
  readonly base?: ConfirmedComponentState
  readonly workerProfile: FullXmlSyncWorkerProfileRuntime
  readonly borrowedForms?: readonly {
    readonly logicalAddress: string
    readonly extensionProjectPath: string
    readonly baseProjectPath: string
    readonly savedProjectPath?: string
  }[]
}

export interface FullXmlSyncComponentProfile {
  readonly kind: XmlSyncProfileKind
  supports(address: ComponentAddress): boolean
  baseAddress(address: ComponentAddress): ComponentAddress | undefined
  confirm(params: {
    readonly target: ConfirmedComponentState
    readonly base?: ConfirmedComponentState
  }): FullXmlSyncProfileRuntime | Promise<FullXmlSyncProfileRuntime>
  readonly prepareRuntime?: (params: {
    readonly runtime: FullXmlSyncProfileRuntime
    readonly rootYaml: unknown
  }) => FullXmlSyncProfileRuntime
}

export function resolveFullXmlSyncComponentProfile(
  address: ComponentAddress
): FullXmlSyncComponentProfile {
  const contextual = currentOperationRegistrySet<{
    synchronization: { resolve(input: ComponentAddress): FullXmlSyncComponentProfile }
  }>()
  if (contextual === undefined) throw new Error("Не задан execution context XML-синхронизации")
  return contextual.synchronization.resolve(address)
}
