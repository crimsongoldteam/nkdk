import { childSegmentUid } from "@nkdk/runtime"
import type { ConfigurationIndexBlockEntity, LocalConfigurationIndexReader } from "@nkdk/runtime"

export function createBaseFormConfigurationIndexReader(params: {
  readonly base: LocalConfigurationIndexReader
  readonly extension: LocalConfigurationIndexReader
  readonly formLogicalAddress: string
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): LocalConfigurationIndexReader {
  const baseFormLogicalAddress = childSegmentUid(params.formLogicalAddress, "ОсноваФормы")
  const allocatedExtensionXmlIds = allocateExtensionXmlIds(params)
  const representation = (logicalAddress: string): ConfigurationIndexBlockEntity | undefined =>
    params.extension.entity(`${baseFormLogicalAddress}${logicalAddress.slice(params.formLogicalAddress.length)}`)
  const entity = (logicalAddress: string): ConfigurationIndexBlockEntity | undefined => {
    const base = params.base.entity(logicalAddress)
    const extension = params.extension.entity(logicalAddress)
    const saved = representation(logicalAddress)
    const source = base ?? extension ?? saved
    if (source === undefined) return undefined
    const useExtensionIdentity = params.extensionIdentityAddresses.has(logicalAddress)
    const identities = useExtensionIdentity ? extension : base
    const xmlId = identities?.xmlId ?? (useExtensionIdentity ? allocatedExtensionXmlIds.get(logicalAddress) : undefined)
    return {
      logicalAddress,
      ...(identities?.uuid === undefined ? {} : { uuid: identities.uuid }),
      ...(xmlId === undefined ? {} : { xmlId }),
      ...(saved?.children === undefined ? (source.children === undefined ? {} : { children: source.children }) : { children: saved.children }),
    }
  }
  const addresses = new Set<string>()
  for (const item of params.base.entities()) addresses.add(item.logicalAddress)
  for (const item of params.extension.entities()) {
    if (params.extensionIdentityAddresses.has(item.logicalAddress)) addresses.add(item.logicalAddress)
    if (item.logicalAddress === baseFormLogicalAddress || item.logicalAddress.startsWith(`${baseFormLogicalAddress}.`)) {
      addresses.add(`${params.formLogicalAddress}${item.logicalAddress.slice(baseFormLogicalAddress.length)}`)
    }
  }
  return {
    entity,
    *entities() {
      for (const logicalAddress of [...addresses].sort(compareUtf8)) {
        const value = entity(logicalAddress)
        if (value !== undefined) yield value
      }
    },
  }
}

function allocateExtensionXmlIds(params: {
  readonly extension: LocalConfigurationIndexReader
  readonly formLogicalAddress: string
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): ReadonlyMap<string, string> {
  const result = new Map<string, string>()
  const usedBySpace = new Map<string, Set<string>>()
  for (const entity of params.extension.entities()) {
    const space = identitySpace(params.formLogicalAddress, entity.logicalAddress)
    if (space === undefined || entity.xmlId === undefined) continue
    const used = usedBySpace.get(space) ?? new Set<string>()
    used.add(entity.xmlId)
    usedBySpace.set(space, used)
  }
  for (const logicalAddress of [...params.extensionIdentityAddresses].sort(compareUtf8)) {
    if (params.extension.entity(logicalAddress)?.xmlId !== undefined) continue
    const space = identitySpace(params.formLogicalAddress, logicalAddress)
    if (space === undefined) continue
    const used = usedBySpace.get(space) ?? new Set<string>()
    let next = 1_000_001
    while (used.has(String(next))) next++
    const xmlId = String(next)
    used.add(xmlId)
    usedBySpace.set(space, used)
    result.set(logicalAddress, xmlId)
  }
  return result
}

function identitySpace(formLogicalAddress: string, logicalAddress: string): string | undefined {
  return ["Атрибут", "Команда", "Параметр"].find((segment) =>
    logicalAddress.startsWith(`${formLogicalAddress}.${segment}.`)
  )
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
