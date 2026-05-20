import { describe, it } from "vitest"

// vi.mock("uuid", () => ({
//   v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
// }))

// const configurationContext: ConfigurationContextWithExportToXML = {
//   version: "2.20",
//   defaultLanguage: "ru",
//   exportToYAML: { toTyped: false },
//   exportToXML: {
//     itemsTree: [],
//     configDumpInfo: new Map(),
//     version: "2.20",
//   },
// }

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
    //   const fullPath = join(__dirname, "Before/Form.xml")
    //   const xml = readFileSync(fullPath, "utf-8")
    //   const fullPathMetadata = join(__dirname, "Before/Metadata.xml")
    //   const xmlMetadata = readFileSync(fullPathMetadata, "utf-8")
    //   const originalFormXml = importContentFromXML<{ Form: ClientApplicationFormXML }>(xml)
    //   const originalFormMetadataXml = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(xmlMetadata)
    //   const form = importClientApplicationFormFromXML(
    //     configurationContext,
    //     originalFormXml.Form,
    //     originalFormMetadataXml.MetaDataObject
    //   )
    //   const yamlObject = exportClientApplicationFormToYAML(configurationContext, form)
    //   const yaml = exportToYAML(yamlObject)
    //   writeFileSync(join(__dirname, "After/Form.yml"), yaml, "utf-8")
    //   const importedYaml = importFromYAML<ClientApplicationFormYAML>(yaml)
    //   const newForm = importClientApplicationFormFromYAML(configurationContext, importedYaml)
    //   const newXMLData = exportClientApplicationFormToXML({
    //     context: configurationContext,
    //     form: newForm,
    //     referenceForm: newForm,
    //   })
    //   const newXML = xmlExport({ Form: newXMLData })
    //   writeFileSync(join(__dirname, "After/Form.xml"), newXML, "utf-8")
    //   const newXMLMetadataData = exportFormMetadataToXML(
    //     configurationContext,
    //     undefined,
    //     newForm,
    //     "ФормаСвойствИзмерения"
    //   )
    //   const newXMLMetadata = xmlExport({ MetaDataObject: newXMLMetadataData })
    //   writeFileSync(join(__dirname, "After/Metadata.xml"), newXMLMetadata, "utf-8")
    // })
    // it("should import metadata catalog from XML", () => {
    //   const importedXml = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(metadataCatalogContent)
    //   const xmlData = importMetadataCatalogFromXML(mockContextFromXML(), mockRule, importedXml.MetaDataObject)
    //   const exportedYAML = exportMetadataCatalogToYAML(mockContext, mockRule, xmlData)
    //   const yamlString = exportToYAML(exportedYAML!)
    //   writeFileSync(join(__dirname, "After/Контрагенты.yml"), yamlString, "utf-8")
    //   const importedYAML = importFromYAML<MetadataCatalogYAML>(yamlString)
    //   const newData = importMetadataCatalogFromYAML(mockContext, mockRule,  importedYAML, "Номенклатура")
    //   const newXml = exportMetadataCatalogToXML(mockMetadataCatalogContext, newData)
    //   const newXmlString = xmlExport({ MetaDataObject: newXml })
    //   writeFileSync(join(__dirname, "After/Контрагенты.xml"), newXmlString, "utf-8")
  })
})
