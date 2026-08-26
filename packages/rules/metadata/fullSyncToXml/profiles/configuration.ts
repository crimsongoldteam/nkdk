import {
  readConfirmedComponentIndex,
  type FullXmlSyncComponentProfile,
  type FullXmlSyncProfileRuntime,
} from "../componentProfile"
import { buildXmlComponentReconstructionProfile } from "../../project/xmlReconstructionProfile"

export const configurationFullXmlSyncProfile: FullXmlSyncComponentProfile = {
  kind: "configuration",
  supports: (address) => address.kind === "configuration",
  baseAddress: () => undefined,
  confirm: confirmConfigurationFullXmlSync,
}

type ReadIndex = (
  state: Parameters<typeof readConfirmedComponentIndex>[0],
) => Awaited<ReturnType<typeof readConfirmedComponentIndex>>

export function confirmConfigurationFullXmlSync(
  params: Parameters<FullXmlSyncComponentProfile["confirm"]>[0],
  readIndex: ReadIndex,
): FullXmlSyncProfileRuntime
export function confirmConfigurationFullXmlSync(
  params: Parameters<FullXmlSyncComponentProfile["confirm"]>[0],
): Promise<FullXmlSyncProfileRuntime>
export function confirmConfigurationFullXmlSync(
  { target, base }: Parameters<FullXmlSyncComponentProfile["confirm"]>[0],
  readIndex: ReadIndex | typeof readConfirmedComponentIndex = readConfirmedComponentIndex,
): FullXmlSyncProfileRuntime | Promise<FullXmlSyncProfileRuntime> {
  if (target.structure.address.kind !== "configuration") {
    throw new Error("Профиль configuration получил другой вид компонента")
  }
  if (base !== undefined) {
    throw new Error("Для основной конфигурации не должна передаваться базовая конфигурация")
  }
  const reader = readIndex(target)
  if (reader instanceof Promise) {
    return reader.then((resolved) => confirmedRuntime(target, resolved))
  }
  return confirmedRuntime(target, reader)
}

function confirmedRuntime(
  target: Parameters<FullXmlSyncComponentProfile["confirm"]>[0]["target"],
  reader: Awaited<ReturnType<typeof readConfirmedComponentIndex>>,
): FullXmlSyncProfileRuntime {
  const reconstruction = buildXmlComponentReconstructionProfile({
    componentKind: "configuration",
    target: {
      logicalAddresses: target.indexes.logicalAddresses.map(({ logicalAddress }) => logicalAddress),
      index: reader,
    },
  })
  return {
    kind: "configuration",
    target,
    workerProfile: {
      kind: "configuration",
      ...reconstruction,
    },
  }
}
