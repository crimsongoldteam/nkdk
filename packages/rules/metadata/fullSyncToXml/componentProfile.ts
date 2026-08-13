import type { ComponentAddress } from "@nkdk/runtime"
import type {
  ConfigurationProjectFile,
  ConfigurationIndexStoreDescriptor,
} from "../configurationIndex"
import type { ConfirmedComponentState } from "../project/componentState/types"
import type { XMLDefaultVariant } from "@nkdk/runtime"
import { currentOperationRegistrySet } from "../operations/operationExecutionContext"
import {
  createLocalConfigurationIndexReader,
  type LocalConfigurationIndexReader,
} from "../configurationIndex"
import { openConfigurationIndexStore } from "../configurationIndex/store"

export type XmlSyncProfileKind = "configuration" | "configurationExtension"

export interface FullXmlSyncWorkerProfileRuntime {
  readonly kind: XmlSyncProfileKind
  readonly componentKind: ComponentAddress["kind"]
  readonly adoptedUuids: Readonly<Record<string, string>>
  readonly typeDescriptionXMLNameByType?: Readonly<Record<string, string>>
  readonly xmlDefaultVariantByLogicalAddress?: Readonly<Record<string, XMLDefaultVariant>>
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
  readonly baseForms?: {
    readonly componentDir: string
    readonly projectFiles: readonly ConfigurationProjectFile[]
    readonly targetProjectFiles?: readonly ConfigurationProjectFile[]
    readonly snapshot: ConfigurationIndexStoreDescriptor
  }
}

export function readConfirmedComponentIndex(
  state: ConfirmedComponentState,
  projectPaths = state.indexes.logicalAddresses.map(({ sourceProjectPath }) => sourceProjectPath),
): LocalConfigurationIndexReader {
  const store = openConfigurationIndexStore(state.snapshot.descriptor, "readOnly")
  try {
    return createLocalConfigurationIndexReader(store.getBlocks(projectPaths))
  } finally {
    void store.close()
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
  }): FullXmlSyncProfileRuntime
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
