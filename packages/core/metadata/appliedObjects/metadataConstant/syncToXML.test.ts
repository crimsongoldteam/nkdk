import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataConstantRules } from "./rules"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataConstant", () => {
  it("читает YAML с common form и записывает XML", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataConstantRules,
      name: "КонстантаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["КонстантаВсеСвойства.xml", "Ext/ManagerModule.bsl", "Ext/ValueManagerModule.bsl"],
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeXML(result), path).toBe(normalizeXML(expected))
    }
  })
})
