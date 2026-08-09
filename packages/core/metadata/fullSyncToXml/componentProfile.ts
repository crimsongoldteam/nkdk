import type { ComponentAddress } from "../components/address"
import type {
  ConfigurationProjectFile,
  SharedConfigurationIndexSnapshot,
} from "../configurationIndex"
import type { ConfirmedComponentState } from "../project/componentState/types"
import type { XMLDefaultVariant } from "../context/types"

export type XmlSyncProfileKind = "configuration" | "configurationExtension"

export interface FullXmlSyncWorkerProfileRuntime {
  readonly kind: XmlSyncProfileKind
  readonly componentKind: ComponentAddress["kind"]
  readonly adoptedUuids: Readonly<Record<string, string>>
  readonly xmlDefaultVariantByLogicalAddress?: Readonly<Record<string, XMLDefaultVariant>>
  readonly referencePathByCurrentPath?: ReadonlyMap<string, string>
  readonly baseForms?: {
    readonly componentDir: string
    readonly projectFiles: readonly ConfigurationProjectFile[]
    readonly snapshot: SharedConfigurationIndexSnapshot
  }
}

export interface FullXmlSyncProfileRuntime {
  readonly kind: XmlSyncProfileKind
  readonly target: ConfirmedComponentState
  readonly base?: ConfirmedComponentState
  readonly workerProfile: FullXmlSyncWorkerProfileRuntime
}

export interface FullXmlSyncComponentProfile {
  readonly kind: XmlSyncProfileKind
  supports(address: ComponentAddress): boolean
  baseAddress(address: ComponentAddress): ComponentAddress | undefined
  confirm(params: {
    readonly target: ConfirmedComponentState
    readonly base?: ConfirmedComponentState
  }): FullXmlSyncProfileRuntime
}

const profiles = new Map<XmlSyncProfileKind, FullXmlSyncComponentProfile>()

export function registerFullXmlSyncComponentProfile(
  profile: FullXmlSyncComponentProfile
): void {
  if (profiles.has(profile.kind)) {
    throw new Error(`Профиль XML-синхронизации уже зарегистрирован: ${profile.kind}`)
  }
  profiles.set(profile.kind, profile)
}

export function resolveFullXmlSyncComponentProfile(
  address: ComponentAddress
): FullXmlSyncComponentProfile {
  const matches = [...profiles.values()].filter((profile) => profile.supports(address))
  if (matches.length === 0) {
    throw new Error(`Не найден профиль XML-синхронизации для компонента: ${address.kind}`)
  }
  if (matches.length > 1) {
    throw new Error(`Несколько профилей XML-синхронизации поддерживают компонент: ${address.kind}`)
  }
  return matches[0]!
}
