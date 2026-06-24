import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readSequenceYAML } from "./__fixtures__/sync/data"
import { MetadataSequenceRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataSequence", () => {
  const name = "ПоследовательностьВсеПоля"

  it("читает Sequence из XML и записывает Свойства.yaml + связанные файлы", async () => {
    const { outputDir, inputDir, yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataSequenceRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readSequenceYAML,
    })
    expect(yaml.result).toBe(yaml.expected)

    const expectedRecordSetModule = fs.readFileSync(join(inputDir, name, "Ext", "RecordSetModule.bsl"), "utf-8")
    expect(fs.readFileSync(join(outputDir, name, "МодульНабораЗаписей.bsl"), "utf-8")).toBe(expectedRecordSetModule)
    expect(yaml.result).toContain("ДополнительныеИндексы:")
    expect(yaml.result).toContain("Имя: Индекс1")
    expect(yaml.result).toContain("Таблица: Sequence.ПоследовательностьВсеПоля")
    expect(yaml.result).toContain("ИндексируемыеПоля:\n      - Recorder")
    expect(yaml.result).toContain("ДополнительныеПоля:\n      - Period")
  })
})
