import { formatCanonicalMetadataTargetToYAML } from "../../ruleRuntime/metadataTarget"
import {
  readConfirmedComponentIndex,
  type FullXmlSyncComponentProfile,
  type FullXmlSyncProfileRuntime,
} from "../componentProfile"
import { configurationExtensionTypeDescriptionXMLNameByType } from "../../appliedObjects/configurationExtension/typeDescriptionPolicy"
import { expandMetadataPathPattern } from "../../resourceTopology/core/patterns"
import type { ConfirmedComponentState } from "../../project/componentState/types"

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
  confirm: confirmConfigurationExtensionFullXmlSync,
}

type ReadIndex = (
  state: Parameters<typeof readConfirmedComponentIndex>[0],
) => Awaited<ReturnType<typeof readConfirmedComponentIndex>>

export function confirmConfigurationExtensionFullXmlSync(
  params: Parameters<FullXmlSyncComponentProfile["confirm"]>[0],
  readIndex: ReadIndex,
): FullXmlSyncProfileRuntime
export function confirmConfigurationExtensionFullXmlSync(
  params: Parameters<FullXmlSyncComponentProfile["confirm"]>[0],
): Promise<FullXmlSyncProfileRuntime>
export function confirmConfigurationExtensionFullXmlSync(
  { target, base }: Parameters<FullXmlSyncComponentProfile["confirm"]>[0],
  readIndex: ReadIndex | typeof readConfirmedComponentIndex = readConfirmedComponentIndex,
): FullXmlSyncProfileRuntime | Promise<FullXmlSyncProfileRuntime> {
    if (target.structure.address.kind !== "configurationExtension") {
      throw new Error("Профиль configurationExtension получил другой вид компонента")
    }
    if (base === undefined || base.structure.address.kind !== "configuration") {
      throw new Error("Для расширения требуется основная конфигурация")
    }

    const baseReader = readIndex(base)
    if (baseReader instanceof Promise) {
      return baseReader.then((resolved) => confirmedRuntime(target, base, resolved))
    }
    return confirmedRuntime(target, base, baseReader)
}

function confirmedRuntime(
  target: Parameters<FullXmlSyncComponentProfile["confirm"]>[0]["target"],
  base: NonNullable<Parameters<FullXmlSyncComponentProfile["confirm"]>[0]["base"]>,
  baseReader: Awaited<ReturnType<typeof readConfirmedComponentIndex>>,
): FullXmlSyncProfileRuntime {
    assertEqualProjectFiles(
      base.hashes.projectFiles,
      base.snapshot.projectFiles,
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
        baseReader.entity(logicalAddress)?.uuid ??
        baseReader.entity(workerLogicalAddress)?.uuid
      if (uuid === undefined) continue
      adoptedUuids[workerLogicalAddress] = uuid
    }
    if (
      targetAddresses.has("Конфигурация") &&
      baseAddresses.has("Конфигурация") &&
      target.structure.address.kind === "configurationExtension"
    ) {
      const uuid = baseReader.entity("Конфигурация")?.uuid
      if (uuid === undefined) {
        throw new Error('Не найден UUID расширяемой конфигурации "Конфигурация"')
      }
      adoptedUuids["Конфигурация"] = uuid
    }
    const baseProjectPathByLogicalAddress = new Map(
      base.indexes.logicalAddresses.map(({ logicalAddress, sourceProjectPath }) => [logicalAddress, sourceProjectPath]),
    )
    const extensionFormPaths = new Set(target.structure.resources.flatMap((resource) =>
      resource.kind === "content" && (
        resource.rule?.itemType === "ClientApplicationForm" ||
        resource.assignment?.yamlCompanions.some(({ projectRole }) => projectRole === "form") === true
      )
        ? [resource.projectPath]
        : []
    ))
    const extensionFormResourceByPath = new Map(target.structure.resources.flatMap((resource) =>
      resource.kind === "content" && extensionFormPaths.has(resource.projectPath)
        ? [[resource.projectPath, resource] as const]
        : []
    ))
    const borrowedForms = target.indexes.logicalAddresses.flatMap(({ logicalAddress, sourceProjectPath }) => {
      const baseProjectPath = baseProjectPathByLogicalAddress.get(logicalAddress)
      return baseProjectPath === undefined || !extensionFormPaths.has(sourceProjectPath)
        ? []
        : [{
            logicalAddress,
            extensionProjectPath: sourceProjectPath,
            baseProjectPath,
            ...savedBaseFormPath(
              extensionFormResourceByPath.get(sourceProjectPath),
              target.structure.projectPaths,
            ),
          }]
    })
    const xmlDefaultVariantByLogicalAddress = Object.fromEntries(
      [...targetAddresses].map((logicalAddress) => {
        const workerLogicalAddress = formatCanonicalMetadataTargetToYAML(logicalAddress) ?? logicalAddress
        return [
          workerLogicalAddress,
          logicalAddress === "Конфигурация" || baseAddresses.has(logicalAddress) ? "adopted" : "full",
        ] as const
      }),
    )
    for (const { logicalAddress } of borrowedForms) {
      xmlDefaultVariantByLogicalAddress[logicalAddress] = "adopted"
    }
    xmlDefaultVariantByLogicalAddress.Конфигурация = "adopted"

    return {
      kind: "configurationExtension",
      target,
      base,
      ...(borrowedForms.length === 0 ? {} : { borrowedForms }),
      workerProfile: {
        kind: "configurationExtension",
        componentKind: "configurationExtension",
        adoptedUuids,
        xmlDefaultVariantByLogicalAddress,
        baseForms: {
          componentDir: base.structure.componentDir,
          projectFiles: base.hashes.projectFiles,
          targetProjectFiles: target.hashes.projectFiles,
          snapshot: base.snapshot.descriptor,
        },
      },
    }
}

function savedBaseFormPath(
  resource: ConfirmedComponentState["structure"]["resources"][number] | undefined,
  projectPaths: readonly string[],
): { readonly savedProjectPath?: string } {
  const companion = resource?.assignment?.yamlCompanions.find(({ projectRole }) => projectRole === "form")
  if (companion === undefined || resource === undefined) return {}
  const projectPath = expandMetadataPathPattern(companion.projectPattern, resource.values)
  return projectPaths.includes(projectPath) ? { savedProjectPath: projectPath } : {}
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
