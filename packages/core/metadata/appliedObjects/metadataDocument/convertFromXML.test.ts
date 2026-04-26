import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readDocumentYAML } from "./__fixtures__/sync/data"
import { MetadataDocumentRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDocument", () => {
  const name = "ДокументВсеСвойства"

  it("читает Document из XML и пишет Свойства.yaml в outputDir", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataDocumentRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readDocumentYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
  })

  // TODO: convertFromXML для Document пока не выгружает модули и команды
  // в YAML-структуру (МодульОбъекта.bsl, МодульМенеджера.bsl,
  // Команды/<name>.bsl). После расширения convertAppliedObjectFromXML
  // добавить эти проверки по образцу Catalog'а.
})
