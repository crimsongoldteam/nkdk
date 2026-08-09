import { createConfigurationIndexReader } from "../../configurationIndex"
import { formatCanonicalMetadataTargetToYAML } from "../../ruleRuntime/metadataTarget"
import type { FullXmlSyncComponentProfile } from "../componentProfile"
import { configurationExtensionTypeDescriptionXMLNameByType } from "../../appliedObjects/configurationExtension/typeDescriptionPolicy"

export const configurationExtensionFullXmlSyncProfile: FullXmlSyncComponentProfile = {
  kind: "configurationExtension",
  supports: (address) => address.kind === "configurationExtension",
  baseAddress: () => ({ kind: "configuration" }),
  prepareRuntime({ runtime, rootYaml }) {
    return {
      ...runtime,
      workerProfile: {
        ...runtime.workerProfile,
        typeDescriptionXMLNameByType:
          configurationExtensionTypeDescriptionXMLNameByType(rootYaml),
      },
    }
  },
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
      const workerLogicalAddress = formatCanonicalMetadataTargetToYAML(logicalAddress) ?? logicalAddress
      const uuid =
        baseReader.entity(logicalAddress)?.identities?.uuid ??
        baseReader.entity(workerLogicalAddress)?.identities?.uuid
      if (uuid === undefined) continue
      adoptedUuids[workerLogicalAddress] = uuid
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
    const baseProjectPathByLogicalAddress = new Map(
      base.indexes.logicalAddresses.map(({ logicalAddress, sourceProjectPath }) => [logicalAddress, sourceProjectPath]),
    )
    const extensionFormPaths = new Set(target.structure.resources.flatMap((resource) =>
      resource.kind === "content" && resource.rule?.itemType === "ClientApplicationForm"
        ? [resource.projectPath]
        : []
    ))
    const borrowedForms = target.indexes.logicalAddresses.flatMap(({ logicalAddress, sourceProjectPath }) => {
      const baseProjectPath = baseProjectPathByLogicalAddress.get(logicalAddress)
      return baseProjectPath === undefined || !extensionFormPaths.has(sourceProjectPath)
        ? []
        : [{ logicalAddress, extensionProjectPath: sourceProjectPath, baseProjectPath }]
    })

    return {
      kind: "configurationExtension",
      target,
      base,
      ...(borrowedForms.length === 0 ? {} : { borrowedForms }),
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
