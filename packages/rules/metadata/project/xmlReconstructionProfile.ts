import type {
  LocalConfigurationIndexReader,
  XMLDefaultVariant,
} from "@nkdk/runtime"
import { formatCanonicalMetadataTargetToYAML } from "../ruleRuntime/metadataTarget"

export type XmlReconstructionComponentKind = "configuration" | "configurationExtension"

export interface XmlReconstructionProfileIndex {
  readonly logicalAddresses: readonly string[]
  readonly index: Pick<LocalConfigurationIndexReader, "entity" | "entities">
}

export interface XmlComponentReconstructionProfile {
  readonly componentKind: XmlReconstructionComponentKind
  readonly adoptedUuids: Readonly<Record<string, string>>
  readonly xmlDefaultVariantByLogicalAddress: Readonly<Record<string, XMLDefaultVariant>>
}

export interface XmlComponentExportProfile extends XmlComponentReconstructionProfile {
  readonly typeDescriptionXMLNameByType?: Readonly<Record<string, string>>
}

type BuildProfileParams =
  | {
      readonly componentKind: "configuration"
      readonly target: XmlReconstructionProfileIndex
    }
  | {
      readonly componentKind: "configurationExtension"
      readonly target: XmlReconstructionProfileIndex
      readonly base: XmlReconstructionProfileIndex
    }

export function buildXmlComponentReconstructionProfile(
  params: BuildProfileParams,
): XmlComponentReconstructionProfile {
  return params.componentKind === "configuration"
    ? buildConfigurationProfile(params.target)
    : buildConfigurationExtensionProfile(params.target, params.base)
}

function buildConfigurationProfile(
  target: XmlReconstructionProfileIndex,
): XmlComponentReconstructionProfile {
  const indexedRoots = new Set(
    [...target.index.entities()]
      .filter(({ uuid, xmlId }) => uuid !== undefined || xmlId !== undefined)
      .map(({ logicalAddress }) => workerAddress(logicalAddress)),
  )
  const variants: Record<string, XMLDefaultVariant> = {}
  for (const logicalAddress of target.logicalAddresses) {
    const address = workerAddress(logicalAddress)
    setExact(variants, address, hasAddressOrAncestor(indexedRoots, address) ? "indexed" : "full", "Противоречивые варианты XML")
  }
  return frozenProfile("configuration", {}, variants)
}

function buildConfigurationExtensionProfile(
  target: XmlReconstructionProfileIndex,
  base: XmlReconstructionProfileIndex,
): XmlComponentReconstructionProfile {
  const baseAddresses = new Set(base.logicalAddresses.map(workerAddress))
  const adoptedUuids: Record<string, string> = {}
  const variants: Record<string, XMLDefaultVariant> = {}
  const targetAddresses = target.logicalAddresses.includes("Конфигурация")
    ? target.logicalAddresses
    : ["Конфигурация", ...target.logicalAddresses]

  for (const logicalAddress of targetAddresses) {
    const address = workerAddress(logicalAddress)
    const adopted = address === "Конфигурация" || baseAddresses.has(address)
    setExact(variants, address, adopted ? "adopted" : "full", "Противоречивые варианты XML")
    if (!adopted) continue

    const baseEntity = base.index.entity(logicalAddress) ?? base.index.entity(address)
    const targetEntity = target.index.entity(logicalAddress) ?? target.index.entity(address)
    const uuid = baseEntity?.uuid
    if (uuid !== undefined) {
      setExact(adoptedUuids, address, uuid, "Противоречивые UUID")
    } else if (address === "Конфигурация" || targetEntity?.uuid !== undefined) {
      throw new Error(`Не найден UUID основной конфигурации: ${address}`)
    }
  }

  return frozenProfile("configurationExtension", adoptedUuids, variants)
}

function workerAddress(logicalAddress: string): string {
  return formatCanonicalMetadataTargetToYAML(logicalAddress) ?? logicalAddress
}

function hasAddressOrAncestor(addresses: ReadonlySet<string>, logicalAddress: string): boolean {
  let current = logicalAddress
  while (true) {
    if (addresses.has(current)) return true
    const separator = current.lastIndexOf(".")
    if (separator < 0) return false
    current = current.slice(0, separator)
  }
}

function setExact<T extends string>(
  target: Record<string, T>,
  logicalAddress: string,
  value: T,
  label: string,
): void {
  const previous = target[logicalAddress]
  if (previous !== undefined && previous !== value) {
    throw new Error(`${label}: ${logicalAddress}: ${previous} / ${value}`)
  }
  target[logicalAddress] = value
}

function frozenProfile(
  componentKind: XmlReconstructionComponentKind,
  adoptedUuids: Record<string, string>,
  variants: Record<string, XMLDefaultVariant>,
): XmlComponentReconstructionProfile {
  return Object.freeze({
    componentKind,
    adoptedUuids: Object.freeze(adoptedUuids),
    xmlDefaultVariantByLogicalAddress: Object.freeze(variants),
  })
}
