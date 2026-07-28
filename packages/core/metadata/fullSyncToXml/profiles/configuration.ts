import type { FullXmlSyncComponentProfile } from "../componentProfile"

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
    return {
      kind: "configuration",
      target,
      workerProfile: {
        kind: "configuration",
        componentKind: "configuration",
        adoptedUuids: {},
      },
    }
  },
}
