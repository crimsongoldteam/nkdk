import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "./encode"
import { createConfigurationIndexExportRuntime } from "./exportRuntime"
import { createConfigurationIndexReader, snapshotConfigurationIndex } from "./sharedSnapshot"
import { sampleIndex } from "./testData"
import { createConfigurationIndexCollector } from "./collector/writer"
import { exportPropertiesToXML } from "../orchestration/property/toXML"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { ConfigurationContextWithExportToXML } from "../context/types"
import "../commonObjects/metadataValue/toXML"
import "../commonObjects/userSettingsID/toXML"

describe("configuration index reference view", () => {
  it("restores property order and XML aliases from index without reference metadata", () => {
    const data = sampleIndex()
    const source = createConfigurationIndexReader(snapshotConfigurationIndex(encodeConfigurationIndex(data)))
    const collector = createConfigurationIndexCollector()
    const configurationIndex = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      logicalAddress: "Справочник.Товары",
    })
    const context: ConfigurationContextWithExportToXML = {
      defaultLanguage: "ru",
      version: "2.20",
      exportToXML: {
        configDumpInfo: new Map(),
        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    }
    const rule = {
      itemType: "Catalog",
      properties: {
        synonym: { type: "string", xml: "CanonicalSynonym", xmlAliases: ["Synonym"] },
        name: { type: "string", xml: "Name" },
      },
    } as const satisfies MetadataItemRule

    const xml = exportPropertiesToXML({
      context,
      metadata: { itemType: "Catalog", name: "Товары", synonym: "Номенклатура" } as any,
      rule,
    })

    expect(Object.keys(xml)).toEqual(["Name", "Synonym"])
    expect(xml).toEqual({ Name: "Товары", Synonym: "Номенклатура" })
    expect(collector.fragment("Справочник/Товары/Свойства.yaml").xmlNodes).toEqual([
      {
        logicalAddress: "Справочник.Товары",
        order: ["name", "synonym"],
        aliases: { synonym: "Synonym" },
        present: ["name", "synonym"],
      },
    ])
  })

  it("restores XML values from index as reference values for existing type rules", () => {
    const data = sampleIndex()
    const source = createConfigurationIndexReader(
      snapshotConfigurationIndex(
        encodeConfigurationIndex({
          ...data,
          xmlValues: [
            { logicalAddress: "Справочник.Товары.fillValue", xsiNil: true },
            {
              logicalAddress: "Справочник.Товары.userSettingsId",
              userSettingsId: "00000000-0000-4000-8000-000000000099",
            },
          ],
        })
      )
    )
    const collector = createConfigurationIndexCollector()
    const configurationIndex = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      logicalAddress: "Справочник.Товары",
    })
    const context: ConfigurationContextWithExportToXML = {
      defaultLanguage: "ru",
      version: "2.20",
      exportToXML: {
        configDumpInfo: new Map(),
        version: "2.20",
        itemsTree: [],
        configurationIndex,
      },
    }
    const rule = {
      itemType: "Catalog",
      properties: {
        fillValue: { type: "MetadataValue", xml: "FillValue" },
        userSettingsId: { type: "UserSettingsID", xml: "UserSettingsID" },
      },
    } as const satisfies MetadataItemRule

    const xml = exportPropertiesToXML({
      context,
      metadata: { itemType: "Catalog", userSettingsId: true } as any,
      rule,
    })

    expect(xml).toEqual({
      FillValue: { "_xsi:nil": true },
      UserSettingsID: "00000000-0000-4000-8000-000000000099",
    })
  })
})
