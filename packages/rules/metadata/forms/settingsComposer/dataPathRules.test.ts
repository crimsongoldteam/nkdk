import { describe, expect, it } from "vitest"
import { withDataPathRegistrySet } from "@nkdk/runtime/rule-kit"
import { requiresDataPathStandardMemberFormatting } from "../../validation/dataPath/finalizationPredicate"
import { createDataPathRegistrySet, standardMemberNamePairs } from "../../validation/dataPath/registry"
import { settingsComposerDataPathRules } from "./dataPathRules"

describe("settingsComposerDataPathRules", () => {
  it("registers the complete name catalog for deferred formatting", () => {
    const contribution = settingsComposerDataPathRules.find((candidate) => candidate.kind === "formattingNamePairs")

    expect(contribution?.kind === "formattingNamePairs" && contribution.pairs).toHaveLength(68)
    withDataPathRegistrySet(createDataPathRegistrySet(settingsComposerDataPathRules), () => {
      expect(standardMemberNamePairs()).toContainEqual({ internal: "Settings", yaml: "Настройки" })
      expect(requiresDataPathStandardMemberFormatting(
        "КомпоновщикНастроек.Настройки.Отбор",
        "yaml-to-internal",
      )).toBe(true)
    })
  })

  it.each(["SettingsComposer", "КомпоновщикНастроекКомпоновкиДанных"])(
    "registers %s as the canonical SettingsComposer graph",
    (baseType) => {
      const contribution = settingsComposerDataPathRules.find((candidate) => candidate.kind === "typeResolver")

      expect(contribution?.kind === "typeResolver" && contribution.resolver({ baseType })).toMatchObject({
        terminalTypes: ["DataCompositionSettingsComposer"],
        table: { kind: "Registered", type: "DataCompositionSettingsComposer" },
      })
    },
  )

  it("registers DynamicList SettingsComposer before its opaque fallback", () => {
    const contribution = settingsComposerDataPathRules.find((candidate) => candidate.kind === "tableColumn")

    expect(contribution?.kind === "tableColumn" && contribution.resolver({
      table: { kind: "DynamicList" },
      segment: "КомпоновщикНастроек",
      index: {} as never,
    })).toMatchObject({
      name: "КомпоновщикНастроек",
      targetName: "SettingsComposer",
      typeInfo: { terminalTypes: ["DataCompositionSettingsComposer"] },
    })
  })
})
