import { describe, expect, it } from "vitest"
import "../../tests/registerCoreMetadata"
import { MetadataConfigurationRules } from "../appliedObjects/configuration/rules"
import { MetadataConfigurationExtensionRules } from "../appliedObjects/configurationExtension/rules"
import { getMetadataComponentDescriptor } from "./descriptor"

describe("metadata component descriptors", () => {
  it("возвращает корневое правило основной конфигурации", () => {
    expect(getMetadataComponentDescriptor("configuration").rootRule)
      .toBe(MetadataConfigurationRules)
  })

  it("возвращает корневое правило расширения", () => {
    expect(getMetadataComponentDescriptor("configurationExtension").rootRule)
      .toBe(MetadataConfigurationExtensionRules)
  })
})
