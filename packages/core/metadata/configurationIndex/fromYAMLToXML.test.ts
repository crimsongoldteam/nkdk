import { describe, expect, it } from "vitest"
import type { ConfigurationContextWithExportToXML } from "../context/types"
import { convertPropertiesFromYAMLToXML } from "../orchestration/property/fromYAMLToXML"
import type { MetadataItemRule } from "../orchestration/property/types"
import { createConfigurationIndexCollector } from "./collector/writer"
import { encodeConfigurationIndex } from "./encode"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "./sharedSnapshot"
import { sampleIndex } from "./testData"

import "../commonObjects/metadataValue/toXML"
import "../commonObjects/userSettingsID/toXML"

function contextWithIndex(xmlValues = sampleIndex().xmlValues): {
  context: ConfigurationContextWithExportToXML
  collector: ReturnType<typeof createConfigurationIndexCollector>
} {
  const data = { ...sampleIndex(), xmlValues }
  const source = createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(data)))
  const collector = createConfigurationIndexCollector()
  const configurationIndex = createConfigurationIndexExportRuntime({
    source,
    collector,
    targetProjectPath: "Справочник/Товары/Свойства.yaml",
    logicalAddress: "Справочник.Товары",
  })
  return {
    collector,
    context: {
      defaultLanguage: "ru",
      version: "2.20",
      exportToXML: {
        configDumpInfo: new Map(),
        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    },
  }
}

describe("configuration index в едином YAML → XML-обходе", () => {
  it("восстанавливает порядок свойств и XML aliases без reference XML", () => {
    const { context, collector } = contextWithIndex()
    const rule = {
      itemType: "Catalog",
      properties: {
        synonym: { type: "string", yaml: "Синоним", xml: "CanonicalSynonym", xmlAliases: ["Synonym"] },
        name: { type: "string", yaml: "Имя", xml: "Name" },
      },
    } as const satisfies MetadataItemRule

    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: { Имя: "Товары", Синоним: "Номенклатура" },
      rule,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({ Name: "Товары", Synonym: "Номенклатура" })
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").xmlNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aliases: { synonym: "Synonym" },
          present: ["synonym"],
        }),
      ])
    )
  })

  it("восстанавливает XML-значения из индекса без reference XML", () => {
    const { context } = contextWithIndex([
      { logicalAddress: "Справочник.Товары.fillValue", xsiNil: true },
      {
        logicalAddress: "Справочник.Товары.userSettingsId",
        userSettingsId: "00000000-0000-4000-8000-000000000099",
      },
    ])
    const rule = {
      itemType: "Catalog",
      properties: {
        fillValue: { type: "MetadataValue", yaml: "ЗначениеЗаполнения", xml: "FillValue" },
        userSettingsId: { type: "UserSettingsID", yaml: "ИдентификаторНастройки", xml: "UserSettingsID" },
      },
    } as const satisfies MetadataItemRule

    const result = convertPropertiesFromYAMLToXML({
      context,
      yaml: { ИдентификаторНастройки: "Истина" },
      rule,
      outputs: [{ key: "owner" }],
    })

    expect(result.outputs.get("owner")).toEqual({
      FillValue: { "_xsi:nil": true },
      UserSettingsID: "00000000-0000-4000-8000-000000000099",
    })
  })
})
