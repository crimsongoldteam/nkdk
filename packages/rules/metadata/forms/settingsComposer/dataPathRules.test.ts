import { describe, expect, it } from "vitest"
import { settingsComposerDataPathRules } from "./dataPathRules"

describe("settingsComposerDataPathRules", () => {
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
