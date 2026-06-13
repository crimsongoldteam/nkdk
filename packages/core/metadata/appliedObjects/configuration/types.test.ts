import { describe, expect, it } from "vitest"
import type { MetadataConfiguration, MetadataConfigurationYAML } from "./types"

describe("MetadataConfiguration compatibility mode types", () => {
  it("uses registered compatibility mode values in model and YAML types", () => {
    const metadata: MetadataConfiguration = {
      itemType: "MetadataConfiguration",
      name: "Конфигурация",
      configurationExtensionCompatibilityMode: "Version8_3_27",
      defaultLanguage: "Language.Русский",
      compatibilityMode: "Version8_3_27",
    }
    const yaml: MetadataConfigurationYAML = {
      Имя: "Конфигурация",
      РежимСовместимостиРасширенияКонфигурации: "Версия8_3_27",
      ОсновнойЯзык: "Language.Русский",
      РежимСовместимости: "Версия8_3_27",
    }

    expect(metadata.compatibilityMode).toBe("Version8_3_27")
    expect(yaml.РежимСовместимости).toBe("Версия8_3_27")
  })
})
