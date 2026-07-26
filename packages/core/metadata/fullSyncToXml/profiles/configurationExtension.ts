import { createConfigurationIndexReader } from "../../configurationIndex"
import { childSegmentUid } from "../../configurationIndex/logicalAddress"
import { EXTENSION_PROPERTY_ORDER_SEGMENT } from "../../appliedObjects/configurationExtension/propertyStates"
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
    const indexedPropertyOrderByLogicalAddress = extensionPropertyOrders(targetReader)
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
      ...[...targetSnapshotUuidAddresses].filter((logicalAddress) =>
        snapshotMarksAdopted(targetReader, logicalAddress)
      ),
      ...target.indexes.logicalAddresses
        .map(({ logicalAddress }) => logicalAddress)
        .filter(
          (logicalAddress) =>
            !targetSnapshotUuidAddresses.has(logicalAddress) &&
            baseUuids.has(logicalAddress)
        ),
    ])
    for (const logicalAddress of targetAddresses) {
      if (logicalAddress === "Конфигурация") continue
      if (!baseAddresses.has(logicalAddress)) continue
      const uuid = baseUuids.get(logicalAddress)
      if (uuid === undefined) {
        throw new Error(`Не найден UUID заимствованного элемента "${logicalAddress}"`)
      }
      adoptedUuids[logicalAddress] = uuid
    }
    if (snapshotHasExtendedConfigurationObject(targetReader, "Конфигурация")) {
      const uuid = baseUuids.get("Конфигурация")
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
            Object.keys(adoptedUuids).map((logicalAddress) => [
              logicalAddress,
              "adopted",
            ] as const)
          ),
          Конфигурация: "indexed",
        },
        indexedPropertyOrderByLogicalAddress,
        baseForms: {
          componentDir: base.structure.componentDir,
          projectFiles: base.hashes.projectFiles,
        },
      },
    }
  },
}

function extensionPropertyOrders(
  reader: ReturnType<typeof createConfigurationIndexReader>
): Readonly<Record<string, readonly string[]>> {
  const marker = `.${EXTENSION_PROPERTY_ORDER_SEGMENT}:`
  const result: Record<string, readonly string[]> = {}
  for (const node of reader.xmlNodes()) {
    const markerIndex = node.logicalAddress.lastIndexOf(marker)
    if (markerIndex < 0 || node.order === undefined) continue
    const logicalAddress = node.logicalAddress.slice(0, markerIndex)
    if ((result[logicalAddress]?.length ?? -1) < node.order.length) {
      result[logicalAddress] = node.order
    }
  }
  return result
}

function snapshotHasExtendedConfigurationObject(
  reader: ReturnType<typeof createConfigurationIndexReader>,
  logicalAddress: string
): boolean {
  const extensionNode = reader.xmlNode(
    childSegmentUid(logicalAddress, EXTENSION_PROPERTY_ORDER_SEGMENT)
  )
  return (
    extensionNode?.order?.includes("extendedConfigurationObject") === true ||
    extensionNode?.present?.includes("extendedConfigurationObject") === true
  )
}

function snapshotMarksAdopted(
  reader: ReturnType<typeof createConfigurationIndexReader>,
  logicalAddress: string
): boolean {
  const node = reader.xmlNode(logicalAddress)
  const extensionNode = reader.xmlNode(
    childSegmentUid(logicalAddress, EXTENSION_PROPERTY_ORDER_SEGMENT)
  )
  return (
    node?.order?.includes("objectBelonging") === true ||
    node?.present?.includes("objectBelonging") === true ||
    extensionNode?.order?.includes("objectBelonging") === true ||
    extensionNode?.present?.includes("objectBelonging") === true
  )
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
