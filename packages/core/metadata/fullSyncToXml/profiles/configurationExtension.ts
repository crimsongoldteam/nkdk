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
      [...baseReader.files()],
      "основная конфигурация не синхронизирована"
    )
    const baseAddresses = new Set(base.indexes.logicalAddresses.map(({ logicalAddress }) => logicalAddress))
    const targetAddresses = new Set(target.indexes.logicalAddresses.map(({ logicalAddress }) => logicalAddress))
    const adoptedUuids: Record<string, string> = {}
    for (const logicalAddress of targetAddresses) {
      if (logicalAddress === "Конфигурация") continue
      if (!baseAddresses.has(logicalAddress)) continue
      const uuid = baseReader.entity(logicalAddress)?.identities?.uuid
      if (uuid === undefined) continue
      adoptedUuids[logicalAddress] = uuid
    }
    if (
      targetAddresses.has("Конфигурация") &&
      baseAddresses.has("Конфигурация") &&
      targetReader.entity("Конфигурация")?.xml?.extended === true
    ) {
      const uuid = baseReader.entity("Конфигурация")?.identities?.uuid
      if (uuid === undefined) {
        throw new Error('Не найден UUID расширяемой конфигурации "Конфигурация"')
      }
      adoptedUuids["Конфигурация"] = uuid
    }

    return {
      kind: "configurationExtension",
      target,
      base,
      workerProfile: {
        kind: "configurationExtension",
        componentKind: "configurationExtension",
        adoptedUuids,
        xmlDefaultVariantByLogicalAddress: {
          ...Object.fromEntries(
            Object.keys(adoptedUuids).map((logicalAddress) => [logicalAddress, "adopted"] as const)
          ),
          Конфигурация: "indexed",
        },
        baseForms: {
          componentDir: base.structure.componentDir,
          projectFiles: base.hashes.projectFiles,
          snapshot: base.snapshot,
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
