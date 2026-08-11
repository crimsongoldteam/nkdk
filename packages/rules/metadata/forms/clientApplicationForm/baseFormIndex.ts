import { childSegmentUid } from "@nkdk/runtime"
import type { ConfigurationIndexReader, ConfigurationSnapshotEntity } from "@nkdk/runtime"

export function createBaseFormConfigurationIndexReader(params: {
  readonly base: ConfigurationIndexReader
  readonly extension: ConfigurationIndexReader
  readonly formLogicalAddress: string
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): ConfigurationIndexReader {
  const baseFormLogicalAddress = childSegmentUid(params.formLogicalAddress, "ОсноваФормы")
  const extensionRepresentation = (logicalAddress: string): ConfigurationSnapshotEntity | undefined =>
    params.extension.entity(
      `${baseFormLogicalAddress}${logicalAddress.slice(params.formLogicalAddress.length)}`
    )
  const entity = (logicalAddress: string): ConfigurationSnapshotEntity | undefined =>
    projectEntity({
      logicalAddress,
      base: params.base.entity(logicalAddress),
      extension: params.extension.entity(logicalAddress),
      extensionRepresentation: extensionRepresentation(logicalAddress),
      useExtensionIdentities: params.extensionIdentityAddresses.has(logicalAddress),
      useExtensionXmlName:
        params.extension.entity(logicalAddress) !== undefined ||
        params.extension.entity(`${logicalAddress}.name`)?.xml?.present === true,
    })
  const entities = (): ConfigurationSnapshotEntity[] => {
    const addresses = new Set<string>()
    for (const item of params.base.entities()) addresses.add(item.logicalAddress)
    for (const logicalAddress of params.extensionIdentityAddresses) {
      if (params.extension.entity(logicalAddress) !== undefined) addresses.add(logicalAddress)
    }
    for (const item of params.extension.entities()) {
      if (item.logicalAddress === baseFormLogicalAddress || item.logicalAddress.startsWith(`${baseFormLogicalAddress}.`)) {
        addresses.add(`${params.formLogicalAddress}${item.logicalAddress.slice(baseFormLogicalAddress.length)}`)
      }
    }
    return [...addresses]
      .sort(compareUtf8)
      .flatMap((logicalAddress) => {
        const item = entity(logicalAddress)
        return item === undefined ? [] : [item]
      })
  }

  return {
    snapshot: params.base.snapshot,
    header: () => params.base.header(),
    file: (projectPath) => params.base.file(projectPath),
    files: () => params.base.files(),
    entity,
    entities,
    entitiesBySourceProjectPath: (projectPath) =>
      entities().filter((item) => item.sourceProjectPath === projectPath),
  }
}

function projectEntity(params: {
  readonly logicalAddress: string
  readonly base: ConfigurationSnapshotEntity | undefined
  readonly extension: ConfigurationSnapshotEntity | undefined
  readonly extensionRepresentation: ConfigurationSnapshotEntity | undefined
  readonly useExtensionIdentities: boolean
  readonly useExtensionXmlName: boolean
}): ConfigurationSnapshotEntity | undefined {
  const source = params.base ?? params.extension ?? params.extensionRepresentation
  if (source === undefined) return undefined
  const baseFields = params.base === undefined
    ? {
        logicalAddress: source.logicalAddress,
        sourceProjectPath: source.sourceProjectPath,
      }
    : (({ identities: _sourceIdentities, ...fields }) => fields)(params.base)
  const representationFields = params.extensionRepresentation === undefined
    ? baseFields
    : {
        ...(({ xml: _xml, omittedChildren: _omittedChildren, ...fields }) => fields)(baseFields),
        ...(params.extensionRepresentation.omittedChildren === undefined
          ? {}
          : { omittedChildren: params.extensionRepresentation.omittedChildren }),
        ...(params.extensionRepresentation.xml === undefined
          ? {}
          : { xml: params.extensionRepresentation.xml }),
      }
  const identities = params.useExtensionIdentities
    ? params.extension?.identities
    : {
        ...params.base?.identities,
        ...(params.useExtensionXmlName
          ? { xmlName: params.extension?.identities?.xmlName }
          : {}),
      }
  const definedIdentities = identities === undefined
    ? undefined
    : Object.fromEntries(
        Object.entries(identities).filter(([, value]) => value !== undefined)
      )
  return {
    ...representationFields,
    logicalAddress: params.logicalAddress,
    ...(definedIdentities === undefined || Object.keys(definedIdentities).length === 0
      ? {}
      : { identities: definedIdentities }),
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
