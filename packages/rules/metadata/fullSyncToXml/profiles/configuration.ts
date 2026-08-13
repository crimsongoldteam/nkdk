import {
  readConfirmedComponentIndex,
  type FullXmlSyncComponentProfile,
  type FullXmlSyncProfileRuntime,
} from "../componentProfile"

export const configurationFullXmlSyncProfile: FullXmlSyncComponentProfile = {
  kind: "configuration",
  supports: (address) => address.kind === "configuration",
  baseAddress: () => undefined,
  confirm: confirmConfigurationFullXmlSync,
}

export function confirmConfigurationFullXmlSync(
  { target, base }: Parameters<FullXmlSyncComponentProfile["confirm"]>[0],
  readIndex: typeof readConfirmedComponentIndex = readConfirmedComponentIndex,
): FullXmlSyncProfileRuntime {
    if (target.structure.address.kind !== "configuration") {
      throw new Error("Профиль configuration получил другой вид компонента")
    }
    if (base !== undefined) {
      throw new Error("Для основной конфигурации не должна передаваться базовая конфигурация")
    }
    const reader = readIndex(target)
    const indexedItems = [...reader.entities()].flatMap((entity) =>
      entity.uuid === undefined && entity.xmlId === undefined ? [] : [[entity.logicalAddress, "indexed"] as const]
    )
    return {
      kind: "configuration",
      target,
      workerProfile: {
        kind: "configuration",
        componentKind: "configuration",
        adoptedUuids: {},
        xmlDefaultVariantByLogicalAddress: Object.fromEntries(indexedItems),
      },
    }
}
