import { NKDK_CORE_VERSION } from "../../version"
import type { ConfigurationIndexData, ConfigurationIndexFragment } from "./types"

export function sampleIndex(): ConfigurationIndexData {
  return {
    binding: {
      indexGeneration: 1n,
      producerVersion: NKDK_CORE_VERSION,
      componentPath: "cf",
      baseFingerprint: new Uint8Array(),
      configurationVersion: new Uint8Array(),
    },
    projectFiles: [{ projectPath: "Конфигурация.yaml", contentHash: 1n }],
    identities: [
      {
        logicalAddress: "Справочник.Товары",
        kind: "uuid",
        value: "00000000-0000-4000-8000-000000000001",
      },
    ],
    xmlNodes: [
      {
        logicalAddress: "Справочник.Товары",
        order: ["name", "synonym"],
        aliases: { synonym: "Synonym" },
        present: ["name"],
      },
    ],
    xmlValues: [{ logicalAddress: "Справочник.Товары.synonym", explicitEmpty: true, xmlText: "" }],
    localIndexes: {
      metadata: {
        reference: Uint8Array.of(0x52, 0x45, 0x46),
        ownerStrings: Uint8Array.of(0x53, 0x54, 0x52),
        ownerTable: Uint8Array.of(0x4f, 0x57, 0x4e),
      },
      dependencies: [
        {
          sourceProjectPath: "Конфигурация.yaml",
          yamlPath: ["Реквизиты", 0, "Тип"],
          rulePath: [
            { propertyKey: "attributes", nestedItemType: "Attribute" },
            { propertyKey: "type" },
          ],
          kind: "metadataTarget",
          canonical: "Catalog.Товары.Attribute.Артикул",
        },
      ],
    },
  }
}

export function sampleFragments(): ConfigurationIndexFragment[] {
  const data = sampleIndex()
  return [
    {
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      identities: data.identities,
      xmlNodes: data.xmlNodes,
      xmlValues: data.xmlValues,
      localDependencies: data.localIndexes.dependencies.map((dependency) => ({
        ...dependency,
        sourceProjectPath: "Справочник/Товары/Свойства.yaml",
      })),
    },
    {
      targetProjectPath: "Конфигурация.yaml",
      identities: [],
      xmlNodes: [{ logicalAddress: "Конфигурация", present: ["name"] }],
      xmlValues: [],
    },
  ]
}
