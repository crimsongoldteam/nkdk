import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects"
import "~/metadata/systemEnumerations"
import { testExportAppliedObjectToYAML, testImportAppliedObjectFromYAML } from "~/tests/appliedObject"
import { full, fullExportedYAML, fullYAML } from "./__fixtures__/full"
import { MetadataCommonCommandRules } from "./rules"

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
      includeHelpInContents: false,
    })
  })

  it("round-trips full YAML", () => {
    const imported = testImportAppliedObjectFromYAML({
      rule: MetadataCommonCommandRules,
      yaml: fullYAML,
      name: "ОбщаяКомандаПолная",
    })

    expect(
      testExportAppliedObjectToYAML({
        rule: MetadataCommonCommandRules,
        data: { ...imported, name: "ОбщаяКомандаПолная" },
      })
    ).toEqual(fullExportedYAML)
  })
})
