import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { describe, it, vi } from "vitest"
import { exportClientApplicationFormToEnterprise } from "~/metadata/forms/clientApplicationForm/base/exportToEnterprise"
import { exportClientApplicationFormToStructure } from "~/metadata/forms/clientApplicationForm/base/exportToStructure"
import {
  exportClientApplicationFormToXML,
  exportFormMetadataToXML,
} from "~/metadata/forms/clientApplicationForm/base/exportToXML"
import { importClientApplicationFormFromEnterprise } from "~/metadata/forms/clientApplicationForm/base/importFromEnterprise"
import { importClientApplicationFormFromXML } from "~/metadata/forms/clientApplicationForm/base/importFromXML"
import {
  ClientApplicationFormEnterprise,
  ClientApplicationFormXML,
  FormMetadataXML,
} from "~/metadata/forms/clientApplicationForm/base/types"
import { importChildItemsFromStructure } from "~/metadata/forms/collections/childItems/importFromStructure"
import "~/metadata/forms/elements/exportToEnterprise"
import "~/metadata/forms/elements/exportToStructure"
import "~/metadata/forms/elements/exportToXML"
import "~/metadata/forms/elements/importFromEnterprise"
import "~/metadata/forms/elements/importFromXML"
import { xmlExport } from "~/xml/export/exporter"
import importContentFromXML from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

const configurationContext = {
  defaultLanguage: "ru",
}

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

    const fullPathMetadata = join(__dirname, "Before/Metadata.xml")
    const xmlMetadata = readFileSync(fullPathMetadata, "utf-8")

    const originalFormXml = importContentFromXML<{ Form: ClientApplicationFormXML }>(xml)
    const originalFormMetadataXml = importContentFromXML<{ MetaDataObject: FormMetadataXML }>(xmlMetadata)
    const form = importClientApplicationFormFromXML(
      configurationContext,
      originalFormXml.Form,
      originalFormMetadataXml.MetaDataObject
    )
    const yamlObject = exportClientApplicationFormToEnterprise(configurationContext, form)
    const yaml = exportToYAML(yamlObject)
    const structuredObject = exportClientApplicationFormToStructure(configurationContext, form)
    const strings = structuredObject.strings.join("\n")
    writeFileSync(join(__dirname, "After/Form.yml"), yaml, "utf-8")
    writeFileSync(join(__dirname, "After/Form.nkdk"), strings, "utf-8")
    const childItems = importChildItemsFromStructure(configurationContext, strings)
    const importedYaml = importFromYAML<ClientApplicationFormEnterprise>(yaml)
    const newForm = importClientApplicationFormFromEnterprise(configurationContext, importedYaml, childItems)

    const newXMLData = exportClientApplicationFormToXML(configurationContext, newForm)
    const newXML = xmlExport({ Form: newXMLData })
    writeFileSync(join(__dirname, "After/Form.xml"), newXML, "utf-8")

    const newXMLMetadataData = exportFormMetadataToXML(configurationContext, newForm)
    const newXMLMetadata = xmlExport({ MetaDataObject: newXMLMetadataData })
    writeFileSync(join(__dirname, "After/Metadata.xml"), newXMLMetadata, "utf-8")
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

// Какие есть способы работы с ентерпрайс:
// 1 одиночный элемент с генерацией имени (расширенная подсказка, контекстное меню, etc) - имя не нужно, тип не нужен, все необязательные
// 2 подчиненные элементы сложных объектов Командая панель и Таблица (Кнопки, Поля ввода и так далее) - имя нужно (ключ структуры, тип определяется по полю Тип)
// 3 свойства полей присутствующих в схеме (группы, поля ввода, флажки, картинки, декорации) - имя не нужно, все необязательные
