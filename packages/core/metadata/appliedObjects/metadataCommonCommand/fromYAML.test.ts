import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects"
import "~/metadata/systemEnumerations"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromYAML } from "~/tests/appliedObject"
import { full, fullExportedYAML, fullYAML } from "./__fixtures__/full"
import { MetadataCommonCommandRules } from "./rules"
import type { MetadataCommonCommand } from "./types"

describe("import MetadataCommonCommand from YAML", () => {
  it("imports full fixture", () => {
    expect(
      testImportAppliedObjectFromYAML({
        rule: MetadataCommonCommandRules,
        yaml: fullYAML,
        name: "ОбщаяКомандаПолная",
      })
    ).toEqual({
      ...full,
      name: undefined,
      representation: "Auto",
    })
  })

  it("round-trips full YAML", () => {
    const imported = testImportAppliedObjectFromYAML<MetadataCommonCommand>({
      rule: MetadataCommonCommandRules,
      yaml: fullYAML,
      name: "ОбщаяКомандаПолная",
    })

    expect(imported).toBeDefined()
    expect(
      testExportAppliedObjectToYAML({
        rule: MetadataCommonCommandRules,
        data: { ...imported!, name: "ОбщаяКомандаПолная" },
      })
    ).toEqual(fullExportedYAML)
  })
})
