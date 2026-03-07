import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { describe, it, vi } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { importClientApplicationFormFromXML } from "~/metadata/forms/clientApplicationForm/fromXML"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { exportClientApplicationFormToNKDK } from "~/metadata/forms/clientApplicationForm/toNKDK"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
import {
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
  FormMetadataXML,
} from "~/metadata/forms/clientApplicationForm/types"
import { importFormFromNKDK } from "~/tests/fromNKDK"
import { xmlExport } from "~/xml/export/exporter"
import importContentFromXML from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

const configurationContext: ConfigurationContext = {
  defaultLanguage: "ru",
  exportToYAML: { toTyped: false },
}

// const mockMetadataCatalogContext = {
//   ...mockContext,
//   context: {
//     forms: [
//       "ФормаЭлемента",
//       "ФормаГруппы",
//       "ФормаСписка",
//       "ФормаВыбора",
//       "ФормаВыбораГруппы",
//       "ФормаВыбораГруппИЭлементов",
//       "ФормаВыбораНекачественнойНоменклатуры",
//       "ИсторияЦенНоменклатуры",
//       "НастройкаВариантаПоиска",
//       "СовместныеПродажи",
//       "РазблокированиеРеквизитов",
//       "ФормаУстановкиИнтервала",
//       "ФормаУстановкиЗначенийОтбора",
//       "КонтрольУникальности",
//       "НастройкиПараметровКопированияДополнительныхДанных",
//       "СоглашенияСПоставщикамиПоХарактеристикам",
//     ],
//     templates: ["ПФ_MXL_КарточкаНоменклатуры", "ПФ_MXL_КарточкаНоменклатурыЛокализация", "ЗагрузкаИзФайла"],
//     parentName: "Номенклатура",
//   },
// } as MetadataCatalogContext

// const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")
// const metadataCatalogContent = readFileSync(join(__dirname, "Before/Контрагенты.xml"), "utf-8")
// const originalFormXml = readAndParseXMLFile<ClientApplicationFormXML>("forms/clientApplicationForm/full.xml")

describe("DO test", () => {
  it.skip("should import-export form", async () => {
    const fullPath = join(__dirname, "Before/Form.xml")
    const xml = readFileSync(fullPath, "utf-8")

    const fullPathMetadata = join(__dirname, "Before/Metadata.xml")
    const xmlMetadata = readFileSync(fullPathMetadata, "utf-8")

    const originalFormXml = importContentFromXML<{ Form: ClientApplicationFormXML }>(xml)
    const originalFormMetadataXml = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(xmlMetadata)
    const form = importClientApplicationFormFromXML(
      configurationContext,
      originalFormXml.Form,
      originalFormMetadataXml.MetaDataObject
    )
    const yamlObject = exportClientApplicationFormToYAML(configurationContext, form)
    const yaml = exportToYAML(yamlObject)
    const structuredObject = exportClientApplicationFormToNKDK(configurationContext, form)
    const strings = structuredObject.strings.join("\n")
    writeFileSync(join(__dirname, "After/Form.yml"), yaml, "utf-8")
    writeFileSync(join(__dirname, "After/Form.nkdk"), strings, "utf-8")

    const sourceForm = await importFormFromNKDK(configurationContext, strings)

    const importedYaml = importFromYAML<ClientApplicationFormYAML>(yaml)
    const newForm = importClientApplicationFormFromYAML(configurationContext, importedYaml, sourceForm!)

    const newXMLData = exportClientApplicationFormToXML(configurationContext, newForm)
    const newXML = xmlExport({ Form: newXMLData })
    writeFileSync(join(__dirname, "After/Form.xml"), newXML, "utf-8")

    const newXMLMetadataData = exportFormMetadataToXML(
      configurationContext,
      undefined,
      newForm,
      "ФормаСвойствИзмерения"
    )
    const newXMLMetadata = xmlExport({ MetaDataObject: newXMLMetadataData })
    writeFileSync(join(__dirname, "After/Metadata.xml"), newXMLMetadata, "utf-8")
  })
  // it("should import metadata catalog from XML", () => {
  //   const importedXml = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(metadataCatalogContent)
  //   const xmlData = importMetadataCatalogFromXML(mockContext, mockRule, importedXml.MetaDataObject)
  //   const exportedYAML = exportMetadataCatalogToYAML(mockContext, mockRule, xmlData)
  //   const yamlString = exportToYAML(exportedYAML!)
  //   writeFileSync(join(__dirname, "After/Контрагенты.yml"), yamlString, "utf-8")
  //   const importedYAML = importFromYAML<MetadataCatalogYAML>(yamlString)
  //   const newData = importMetadataCatalogFromYAML(mockContext, mockRule,  importedYAML, "Номенклатура")
  //   const newXml = exportMetadataCatalogToXML(mockMetadataCatalogContext, newData)
  //   const newXmlString = xmlExport({ MetaDataObject: newXml })
  //   writeFileSync(join(__dirname, "After/Контрагенты.xml"), newXmlString, "utf-8")
  // })
})
