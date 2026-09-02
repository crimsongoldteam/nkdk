import { createConfigurationLanguages, parseMetadataYaml } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { MetadataCommonFormRules } from "../appliedObjects/metadataCommonForm/rules"
import { validateMetadataRuleYamlProperties } from "./metadataRuleYamlProperties"

describe("validateMetadataRuleYamlProperties", () => {
  it("проверяет локализацию фиксированной вложенной формы один раз", () => {
    const parsed = parseMetadataYaml([
      "Форма:",
      "  Заголовок:",
      "    ru: Заголовок",
      "    en: Title",
    ].join("\n"))
    let localizedTextProperties = 0

    const diagnostics = validateMetadataRuleYamlProperties({
      filePath: "/tmp/ОбщаяФорма/РабочийСтол/Свойства.yaml",
      parsed,
      rule: MetadataCommonFormRules,
      context: {
        version: "2.20",
        languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
      },
      name: "РабочийСтол",
      onLocalizedTextProperty: () => { localizedTextProperties += 1 },
    })

    expect(diagnostics).toEqual([
      expect.objectContaining({
        path: "/Форма/Заголовок/en",
        message: expect.stringContaining("Незарегистрированный язык en"),
      }),
    ])
    expect(localizedTextProperties).toBe(1)
  })
})
