import fs from "node:fs"
import { describe, expect, it } from "vitest"
import { createDirectRoundTripContexts, testMetadataItemFromXMLToYAML, testMetadataItemFromYAMLToXML } from "../../../../tests/directConversion"
import { importContentFromXML } from "../../../../xml/import/importer"
import { withConfigurationIndexFormElementRootLogicalAddress } from "../../../configurationIndex/collector/context"
import { CalendarFieldRules } from "./rules"

describe("CalendarField rules", () => {
  it("сохраняет путь к данным в YAML и восстанавливает его без reference XML", () => {
    const parsed = importContentFromXML<{ CalendarField: Record<string, unknown> }>(
      fs.readFileSync(new URL("./__fixtures__/full.xml", import.meta.url), "utf8")
    )
    const formLogicalAddress = "ОбщаяФорма.Календарь"
    const logicalAddress = `${formLogicalAddress}.Элемент.ПолеКалендаря`
    const contexts = createDirectRoundTripContexts({ logicalAddress })
    const imported = testMetadataItemFromXMLToYAML({
      rule: CalendarFieldRules,
      xml: parsed.CalendarField,
      name: "ПолеКалендаря",
      context: withConfigurationIndexFormElementRootLogicalAddress(contexts.importContext, formLogicalAddress),
    })

    expect(imported.yaml).toMatchObject({ ПутьКДанным: "Реквизит" })

    const exportContext = contexts.exportContext()
    const configurationIndex = exportContext.exportToXML.configurationIndex
    if (configurationIndex === undefined) throw new Error("Не создан runtime индекса конфигурации")
    const exported = testMetadataItemFromYAMLToXML({
      rule: CalendarFieldRules,
      yaml: imported.yaml,
      name: "ПолеКалендаря",
      context: {
        ...exportContext,
        exportToXML: {
          ...exportContext.exportToXML,
          configurationIndex: configurationIndex.withFormElementRootLogicalAddress(formLogicalAddress),
        },
      },
    })

    expect(exported.xml.DataPath).toBe("Реквизит")
  })
})
