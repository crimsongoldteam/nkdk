import { childSegmentUid } from "@nkdk/runtime"
import type { ConfigurationIndexBlockEntity, LocalConfigurationIndexReader } from "@nkdk/runtime"

export function createBaseFormConfigurationIndexReader(params: {
  readonly base: LocalConfigurationIndexReader
  readonly extension: LocalConfigurationIndexReader
  readonly formLogicalAddress: string
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): LocalConfigurationIndexReader {
  const baseFormLogicalAddress = childSegmentUid(params.formLogicalAddress, "ОсноваФормы")
  const representation = (logicalAddress: string): ConfigurationIndexBlockEntity | undefined =>
    params.extension.entity(`${baseFormLogicalAddress}${logicalAddress.slice(params.formLogicalAddress.length)}`)
  const entity = (logicalAddress: string): ConfigurationIndexBlockEntity | undefined => {
    const base = params.base.entity(logicalAddress)
    const extension = params.extension.entity(logicalAddress)
    const saved = representation(logicalAddress)
    const source = base ?? extension ?? saved
    if (source === undefined) return undefined
    const identities = params.extensionIdentityAddresses.has(logicalAddress) ? extension : base
    return {
      logicalAddress,
      ...(identities?.uuid === undefined ? {} : { uuid: identities.uuid }),
      ...(identities?.xmlId === undefined ? {} : { xmlId: identities.xmlId }),
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

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
