import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readBusinessProcessYAML } from "./__fixtures__/sync/data"
import { MetadataBusinessProcessRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataBusinessProcess", () => {
  const name = "БизнесПроцессВсеСвойства"

  it("copies object modules and flowchart", async () => {
    const { outputDir, inputDir } = await testConvertAppliedObjectFromXML({
      rule: MetadataBusinessProcessRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readBusinessProcessYAML,
    })

    for (const [xmlPath, nkdkPath] of [
      ["Ext/ObjectModule.bsl", "МодульОбъекта.bsl"],
      ["Ext/ManagerModule.bsl", "МодульМенеджера.bsl"],
      ["Ext/Flowchart.xml", "Flowchart.xml"],
    ] as const) {
      expect(fs.readFileSync(join(outputDir, name, nkdkPath), "utf-8")).toBe(
        fs.readFileSync(join(inputDir, name, xmlPath), "utf-8")
      )
    }
  })
})
