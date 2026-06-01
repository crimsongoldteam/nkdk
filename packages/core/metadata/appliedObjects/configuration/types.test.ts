import { describe, expect, it } from "vitest"
import type { MetadataConfiguration, MetadataConfigurationYAML } from "./types"

describe("MetadataConfiguration open compatibility mode types", () => {
  it("allows future compatibility mode values in model and YAML types", () => {
    const metadata: MetadataConfiguration = {
      itemType: "MetadataConfiguration",
      name: "Конфигурация",
      configurationExtensionCompatibilityMode: "Version8_3_28",
      defaultLanguage: "Language.Русский",
      compatibilityMode: "Version8_3_28",
    }
    const yaml: MetadataConfigurationYAML = {
      Имя: "Конфигурация",
      РежимСовместимостиРасширенияКонфигурации: "Version8_3_28",
      ОсновнойЯзык: "Language.Русский",
      РежимСовместимости: "Version8_3_28",
    }

    expect(metadata.compatibilityMode).toBe("Version8_3_28")
    expect(yaml.РежимСовместимости).toBe("Version8_3_28")
  })
})
