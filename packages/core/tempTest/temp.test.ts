import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { describe, it, vi } from "vitest"
import { exportClientApplicationFormToStructure } from "~/metadata/forms/clientApplicationForm/exportToStructure"
import { importClientApplicationFormFromXML } from "~/metadata/forms/clientApplicationForm/fromXML"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import { exportClientApplicationFormToXML, exportFormMetadataToXML } from "~/metadata/forms/clientApplicationForm/toXML"
import { exportClientApplicationFormToYAML } from "~/metadata/forms/clientApplicationForm/toYAML"
import {
  ClientApplicationForm,
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
  FormMetadataXML,
} from "~/metadata/forms/clientApplicationForm/types"
import { importChildItemsFromStructure } from "~/metadata/forms/commonObjects/childItems/importFromStructure"
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

describe.skip("DO test", () => {
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
    const yamlObject = exportClientApplicationFormToYAML(configurationContext, form)
    const yaml = exportToYAML(yamlObject)
    const structuredObject = exportClientApplicationFormToStructure(configurationContext, form)
    const strings = structuredObject.strings.join("\n")
    writeFileSync(join(__dirname, "After/Form.yml"), yaml, "utf-8")
    writeFileSync(join(__dirname, "After/Form.nkdk"), strings, "utf-8")

    const sourceForm: ClientApplicationForm = {
      itemType: "ClientApplicationForm",
      ...importChildItemsFromStructure(configurationContext, strings)!,
      commands: [],
    }

    const importedYaml = importFromYAML<ClientApplicationFormYAML>(yaml)
    const newForm = importClientApplicationFormFromYAML(configurationContext, importedYaml, sourceForm)

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
