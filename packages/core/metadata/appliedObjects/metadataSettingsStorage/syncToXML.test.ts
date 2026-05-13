import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataSettingsStorageRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n").replace(/\n$/, "")

describe("syncAppliedObjectToXML — MetadataSettingsStorage", () => {
  it("читает SettingsStorage из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataSettingsStorageRules,
      name: "ХранилищеНастроекВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "ХранилищеНастроекВсеСвойства.xml",
        "ХранилищеНастроекВсеСвойства/Forms/ФормаЗагрузки.xml",
        "ХранилищеНастроекВсеСвойства/Forms/ФормаЗагрузки/Ext/Form.xml",
        "ХранилищеНастроекВсеСвойства/Forms/ФормаСохранения.xml",
        "ХранилищеНастроекВсеСвойства/Forms/ФормаСохранения/Ext/Form.xml",
        "ХранилищеНастроекВсеСвойства/Templates/Макет.xml",
        "ХранилищеНастроекВсеСвойства/Templates/Макет/Ext/Template.txt",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
