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
    },
    {
      targetProjectPath: "Конфигурация.yaml",
      identities: [],
      xmlNodes: [{ logicalAddress: "Конфигурация", present: ["name"] }],
      xmlValues: [],
    },
  ]
}
