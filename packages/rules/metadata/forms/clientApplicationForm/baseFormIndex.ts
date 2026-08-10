import type { ConfigurationSnapshotEntity } from "@nkdk/runtime"
import type { ConfigurationIndexReader } from "@nkdk/runtime"

export function createBaseFormConfigurationIndexReader(params: {
  readonly base: ConfigurationIndexReader
  readonly extension: ConfigurationIndexReader
  readonly extensionIdentityAddresses: ReadonlySet<string>
}): ConfigurationIndexReader {
  const entity = (logicalAddress: string): ConfigurationSnapshotEntity | undefined =>
    projectEntity({
      base: params.base.entity(logicalAddress),
      extension: params.extension.entity(logicalAddress),
      useExtensionIdentities: params.extensionIdentityAddresses.has(logicalAddress),
    })
  const entities = (): ConfigurationSnapshotEntity[] => {
    const addresses = new Set<string>()
    for (const item of params.base.entities()) addresses.add(item.logicalAddress)
    for (const logicalAddress of params.extensionIdentityAddresses) {
      if (params.extension.entity(logicalAddress) !== undefined) addresses.add(logicalAddress)
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
  readonly base: ConfigurationSnapshotEntity | undefined
  readonly extension: ConfigurationSnapshotEntity | undefined
  readonly useExtensionIdentities: boolean
}): ConfigurationSnapshotEntity | undefined {
  if (!params.useExtensionIdentities) return params.base
  const source = params.base ?? params.extension
  if (source === undefined) return undefined
  const baseFields =
    params.base === undefined
      ? {
          logicalAddress: source.logicalAddress,
          sourceProjectPath: source.sourceProjectPath,
        }
      : (({ identities: _sourceIdentities, ...fields }) => fields)(params.base)
  const identities = params.extension?.identities
  return {
    ...baseFields,
    ...(identities === undefined ? {} : { identities }),
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
