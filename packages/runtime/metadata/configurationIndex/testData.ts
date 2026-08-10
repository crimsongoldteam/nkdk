import type { ConfigurationSnapshot, ConfigurationSnapshotEntity, ConfigurationSnapshotFragment } from "./types"

export const TEST_UUID = "00000000-0000-4000-8000-000000000001"

export function entity(logicalAddress: string, sourceProjectPath: string): ConfigurationSnapshotEntity {
  return {
    logicalAddress,
    sourceProjectPath,
    identities: { xmlName: logicalAddress },
  }
}

export function fragment(
  targetProjectPath: string,
  ...entities: readonly ConfigurationSnapshotEntity[]
): ConfigurationSnapshotFragment {
  return { targetProjectPath, entities }
}

export function sampleSnapshot(): ConfigurationSnapshot {
  return {
    specificationVersion: "1.3",
    indexGeneration: 7n,
    componentPath: "cf",
    files: [
      { projectPath: "Документы/Заказ.yaml", contentHash: 2n },
      { projectPath: "Configuration.yaml", contentHash: 1n },
    ],
    entities: [
      {
        logicalAddress: "Конфигурация",
        sourceProjectPath: "Configuration.yaml",
        identities: { xmlName: "Configuration" },
        omittedChildren: {
          kind: "typedNames",
          items: [{ xmlName: "Attribute", name: "Код" }],
        },
      },
      {
        logicalAddress: "Документ.Заказ",
        sourceProjectPath: "Документы/Заказ.yaml",
        identities: { uuid: TEST_UUID, xmlId: "Order", xmlName: "" },
        omittedChildren: { kind: "names", names: ["Форма", "Макет"] },
        xml: {
          extended: true,
          xsiNil: true,
          explicitEmpty: true,
          xsiType: "xs:string",
          xmlText: "текст",
          xmlPrefix: "xs",
        },
      },
    ],
  }
}

export function reverseInputOrder(snapshot: ConfigurationSnapshot): ConfigurationSnapshot {
  return {
    ...snapshot,
    files: [...snapshot.files].reverse(),
    entities: [...snapshot.entities].reverse(),
  }
}
