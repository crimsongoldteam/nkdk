import { expect, it } from "vitest"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import type { StructuralReferenceCandidate } from "../ruleRuntime/property/fn"
import { getTypeRule, registerTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import type { MetadataItemRule } from "../ruleRuntime/property/types"
import { createPropertyStructuralReferenceRuntime } from "../operations/references"
import { collectStructuralYamlReferences } from "./structuralReferences"

it.each([
  ["setter", "без setter"],
  ["index", "не материализовало индекс"],
] as const)("останавливает сбор при нарушении %s contract", (brokenContract, message) => {
  const originalStructural = getTypeRule("string", "structuralReferences")
  const originalIndex = getTypeRule("string", "collectMetadataTargetReferences")
  if (originalStructural === undefined || originalIndex === undefined) throw new Error("string reference handlers не зарегистрированы")
  const candidate = {
    yamlPath: ["Ссылка"],
    canonical: "Catalog.Товары",
    setCanonical() {},
  } satisfies StructuralReferenceCandidate
  try {
    registerTypeRule("string", "structuralReferences", () => [
      brokenContract === "setter"
        ? { yamlPath: candidate.yamlPath, canonical: candidate.canonical } as unknown as StructuralReferenceCandidate
        : candidate,
    ])
    registerTypeRule("string", "collectMetadataTargetReferences", () => ({
      references: brokenContract === "index"
        ? []
        : [{
            yamlPath: candidate.yamlPath,
            canonical: candidate.canonical,
            target: { kind: "object", root: "Catalog", objectName: "Товары" },
            constraint: { kind: "object" },
          }],
      diagnostics: [],
    }))

    const parsed = parseMetadataYaml("Ссылка: Справочник.Товары")
    const rule = {
      itemType: "TestStructuralReferences",
      properties: { reference: { type: "string", yaml: "Ссылка" } },
    } as MetadataItemRule

    expect(() => collectStructuralYamlReferences({
      filePath: "/project/Свойства.yaml",
      parsed,
      rule,
      yaml: parsed.data,
      context: { version: "2.20", defaultLanguage: "ru" },
      runtime: createPropertyStructuralReferenceRuntime(),
    })).toThrow(message)
  } finally {
    registerTypeRule("string", "structuralReferences", originalStructural)
    registerTypeRule("string", "collectMetadataTargetReferences", originalIndex)
  }
})
