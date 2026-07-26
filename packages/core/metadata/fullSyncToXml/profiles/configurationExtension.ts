import { createConfigurationIndexReader } from "../../configurationIndex"
import type { FullXmlSyncComponentProfile } from "../componentProfile"

export const configurationExtensionFullXmlSyncProfile: FullXmlSyncComponentProfile = {
  kind: "configurationExtension",
  supports: (address) => address.kind === "configurationExtension",
  baseAddress: () => ({ kind: "configuration" }),
  confirm({ target, base }) {
    if (target.structure.address.kind !== "configurationExtension") {
      throw new Error("Профиль configurationExtension получил другой вид компонента")
    }
    if (base === undefined || base.structure.address.kind !== "configuration") {
      throw new Error("Для расширения требуется основная конфигурация")
    }

    const baseReader = createConfigurationIndexReader(base.snapshot)
    const targetReader = createConfigurationIndexReader(target.snapshot)
    assertEqualProjectFiles(
      base.hashes.projectFiles,
      baseReader.projectFiles(),
      "основная конфигурация не синхронизирована"
    )
    const baseAddresses = new Set([
      ...base.indexes.logicalAddresses.map(({ logicalAddress }) => logicalAddress),
      ...baseReader.identities().map(({ logicalAddress }) => logicalAddress),
    ])
    const baseUuids = new Map(
      baseReader
        .identities()
        .filter(({ kind }) => kind === "uuid")
        .map(({ logicalAddress, value }) => [logicalAddress, value])
    )
    const adoptedUuids: Record<string, string> = {}
    const targetSnapshotUuidAddresses = new Set(
      targetReader
        .identities()
        .filter(({ kind }) => kind === "uuid")
        .map(({ logicalAddress }) => logicalAddress)
    )
    const targetAddresses = new Set([
      ...targetSnapshotUuidAddresses,
      ...target.indexes.logicalAddresses
        .map(({ logicalAddress }) => logicalAddress)
        .filter((logicalAddress) => baseUuids.has(logicalAddress)),
    ])
    for (const logicalAddress of targetAddresses) {
      if (!baseAddresses.has(logicalAddress)) continue
      const uuid = baseUuids.get(logicalAddress)
      if (uuid === undefined) {
        throw new Error(`Не найден UUID заимствованного элемента "${logicalAddress}"`)
      }
      adoptedUuids[logicalAddress] = uuid
    }

    return {
      kind: "configurationExtension",
      target,
      base,
      workerProfile: {
        kind: "configurationExtension",
        componentKind: "configurationExtension",
        adoptedUuids,
        baseForms: {
          componentDir: base.structure.componentDir,
          projectFiles: base.hashes.projectFiles,
        },
      },
    }
  },
}

function assertEqualProjectFiles(
  left: readonly { readonly projectPath: string; readonly contentHash: bigint }[],
  right: readonly { readonly projectPath: string; readonly contentHash: bigint }[],
  message: string
): void {
  if (left.length !== right.length) throw new Error(message)
  const rightByPath = new Map(right.map(({ projectPath, contentHash }) => [projectPath, contentHash]))
  if (left.some(({ projectPath, contentHash }) => rightByPath.get(projectPath) !== contentHash)) {
    throw new Error(message)
  }
}
