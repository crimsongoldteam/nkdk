import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { withConfigurationIndexCollector } from "../../configurationIndex/collector/context"
import type { MetadataItemRule } from "../../orchestration"
import { MetadataHTTPServiceRules } from "../metadataHTTPService/rules"
import { MetadataIntegrationServiceRules } from "../metadataIntegrationService/rules"
import { MetadataWebServiceRules } from "../metadataWebService/rules"
import { mockContextFromXML } from "../../../tests/mockContext"
import { readAndParseXMLFixture } from "../../../tests/readFixtureXML"
import { testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"

const cases: Array<{
  label: string
  rule: MetadataItemRule
  importMetaUrl: string
  logicalAddress: string
  projectPath: string
  expected: Array<{ logicalAddress: string; kind: "uuid"; value: string }>
}> = [
  {
    label: "HTTPService URLTemplate и Method",
    rule: MetadataHTTPServiceRules,
    importMetaUrl: import.meta.resolve("../metadataHTTPService/rules.ts"),
    logicalAddress: "HTTPСервис.HTTPСервисВсеСвойства",
    projectPath: "HTTPServices/HTTPСервисВсеСвойства/Свойства.yaml",
    expected: [
      {
        logicalAddress: "HTTPСервис.HTTPСервисВсеСвойства.ШаблонURL.ШаблонURLВсеСвойства",
        kind: "uuid",
        value: "aee983bf-4532-4484-af10-18bec3476e5f",
      },
      {
        logicalAddress: "HTTPСервис.HTTPСервисВсеСвойства.ШаблонURL.ШаблонURLВсеСвойства.Метод.МетодВсеСвойства",
        kind: "uuid",
        value: "5cea292e-474f-4e14-9b79-46832cf8447b",
      },
    ],
  },
  {
    label: "IntegrationService Channel",
    rule: MetadataIntegrationServiceRules,
    importMetaUrl: import.meta.resolve("../metadataIntegrationService/rules.ts"),
    logicalAddress: "СервисИнтеграции.СервисИнтеграцииВсеСвойства",
    projectPath: "IntegrationServices/СервисИнтеграцииВсеСвойства/Свойства.yaml",
    expected: [
      {
        logicalAddress: "СервисИнтеграции.СервисИнтеграцииВсеСвойства.Канал.КаналСервисаИнтеграцииВсеСвойства",
        kind: "uuid",
        value: "25d297b9-3b88-43a8-a579-cf026f9f914f",
      },
    ],
  },
  {
    label: "WebService Operation и Parameter",
    rule: MetadataWebServiceRules,
    importMetaUrl: import.meta.resolve("../metadataWebService/rules.ts"),
    logicalAddress: "WebСервис.WebСервисВсеСвойства",
    projectPath: "WebServices/WebСервисВсеСвойства/Свойства.yaml",
    expected: [
      {
        logicalAddress: "WebСервис.WebСервисВсеСвойства.Операция.ОперацияВсеСвойства",
        kind: "uuid",
        value: "9fc06009-121a-4fe7-af4b-a5640d213cb1",
      },
      {
        logicalAddress: "WebСервис.WebСервисВсеСвойства.Операция.ОперацияВсеСвойства.Параметр.ПараметрВсеСвойства",
        kind: "uuid",
        value: "58088704-401d-4567-a6de-f4ad9266d2b0",
      },
    ],
  },
]

describe("единый XML → YAML-обход: configuration index", () => {
  it.each(cases)(
    "пишет UUID конкретных элементов $label",
    ({ rule, importMetaUrl, logicalAddress, projectPath, expected }) => {
      const collector = createConfigurationIndexCollector()
      const context = withConfigurationIndexCollector(
        mockContextFromXML({ forReference: true }),
        collector,
        logicalAddress
      )
      const parsed = readAndParseXMLFixture<{ MetaDataObject: unknown }>(importMetaUrl, "full.xml")

      testMetadataItemFromXMLToYAML({
        context,
        rule,
        xml: parsed.MetaDataObject,
      })

      expect(collector.fragment(projectPath).identities).toEqual(expect.arrayContaining(expected))
    }
  )
})
