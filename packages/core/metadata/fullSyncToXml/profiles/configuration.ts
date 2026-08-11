import type { FullXmlSyncComponentProfile } from "../componentProfile"
import { createConfigurationIndexReader } from "../../configurationIndex"

export const configurationFullXmlSyncProfile: FullXmlSyncComponentProfile = {
  kind: "configuration",
  supports: (address) => address.kind === "configuration",
  baseAddress: () => undefined,
  confirm({ target, base }) {
    if (target.structure.address.kind !== "configuration") {
      throw new Error("Профиль configuration получил другой вид компонента")
    }
    if (base !== undefined) {
      throw new Error("Для основной конфигурации не должна передаваться базовая конфигурация")
    }
    const reader = createConfigurationIndexReader(target.snapshot)
    const indexedItems = [...reader.entities()].flatMap((entity) =>
      entity.identities === undefined ? [] : [[entity.logicalAddress, "indexed"] as const]
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
  },
}
