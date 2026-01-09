import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { describe, it, vi } from "vitest"
import { exportClientApplicationFormToEnterprise } from "~/metadata/forms/clientApplicationForm/exportToEnterprise"
import { exportClientApplicationFormToStructure } from "~/metadata/forms/clientApplicationForm/exportToStructure"
import { importClientApplicationFormFromXML } from "~/metadata/forms/clientApplicationForm/importFromXML"
import { ClientApplicationFormXML } from "~/metadata/forms/clientApplicationForm/types"
import "~/metadata/forms/elements/exportToEnterprise"
import "~/metadata/forms/elements/exportToStructure"
import "~/metadata/forms/elements/importFromXML"
import importContentFromXML from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { mockСontext } from "../tests/mockContext"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

// const mockMetadataCatalogContext = {
//   ...mockСontext,
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
  it("should import-export form", () => {
    const fullPath = join(__dirname, "Before/Form.xml")
    const xml = readFileSync(fullPath, "utf-8")
    const originalFormXml = importContentFromXML<{ Form: ClientApplicationFormXML }>(xml)

    const form = importClientApplicationFormFromXML(mockСontext, originalFormXml.Form)

    const yamlObject = exportClientApplicationFormToEnterprise(mockСontext, form)

    const yaml = exportToYAML(yamlObject)

    const structuredObject = exportClientApplicationFormToStructure(mockСontext, form)

    writeFileSync(join(__dirname, "After/Form.yml"), yaml, "utf-8")
    writeFileSync(join(__dirname, "After/Form.nkdk"), structuredObject.strings.join("\n"), "utf-8")
  })
  // it("should import metadata catalog from XML", () => {
  //   const importedXml = importContentFromXML<{ MetaDataObject: MetadataCatalogXML }>(metadataCatalogContent)

  //   const xmlData = importMetadataCatalogFromXML(mockСontext, importedXml.MetaDataObject)

  //   const exportedEnterprise = exportMetadataCatalogToEnterprise(mockСontext, xmlData)

  //   const yamlString = exportToYAML(exportedEnterprise!)
  //   writeFileSync(join(__dirname, "After/Контрагенты.yml"), yamlString, "utf-8")

  //   const importedYAML = importFromYAML<MetadataCatalogEnterprise>(yamlString)

  //   const newData = importMetadataCatalogFromEnterprise(mockСontext, importedYAML, "Номенклатура")
  //   const newXml = exportMetadataCatalogToXML(mockMetadataCatalogContext, newData)

  //   const newXmlString = xmlExport({ MetaDataObject: newXml })

  //   writeFileSync(join(__dirname, "After/Контрагенты.xml"), newXmlString, "utf-8")
  // })

  // it("should export schema ", () => {
  //   const catalogSchema = typia.json.schemas<[MetadataCatalogEnterprise], "3.1">()

  //   writeFileSync(join(__dirname, "After/Контрагенты.json"), JSON.stringify(catalogSchema, null, 2), "utf-8")
  // })
})

// Правила определения элементов
// начинается с # - вертикальная группа
// начинается с // - страницы
// начинается с / - страница
// начинается с % - горизонтальная группа
// содержит : - поле ввода
// начинается с < - кнопка
// начинается с < и содержит | - командная панель
// содержит [] - флажок
// содержит () - радиокнопка
// содержит | - таблица
// все остальное - надпись
