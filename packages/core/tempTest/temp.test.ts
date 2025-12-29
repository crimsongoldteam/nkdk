import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { describe, it, vi } from "vitest"
import { stringify } from "yaml"
import { exportMetadataCatalogToEnterprise } from "../metadata/appliedObjects/metadataCatalog/exportToEnterprise"
import {
  exportMetadataCatalogToXML,
  MetadataCatalogContext,
} from "../metadata/appliedObjects/metadataCatalog/exportToXML"
import { importMetadataCatalogFromEnterprise } from "../metadata/appliedObjects/metadataCatalog/importFromEnterprise"
import { importMetadataCatalogFromXML } from "../metadata/appliedObjects/metadataCatalog/importFromXML"
import { MetadataCatalogXML } from "../metadata/appliedObjects/metadataCatalog/types"
import "../metadata/forms/elements/exportToXML"
import "../metadata/forms/elements/importFromXML"
import { mockСontext } from "../tests/mockContext"
import { xmlExport } from "../xml/export/exporter"
import xmlImport from "../xml/import/importer"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

const mockMetadataCatalogContext = {
  ...mockСontext,
  context: {
    forms: [
      "ФормаЭлемента",
      "ФормаГруппы",
      "ФормаСписка",
      "ФормаВыбора",
      "ФормаВыбораГруппы",
      "ФормаВыбораГруппИЭлементов",
      "ФормаВыбораНекачественнойНоменклатуры",
      "ИсторияЦенНоменклатуры",
      "НастройкаВариантаПоиска",
      "СовместныеПродажи",
      "РазблокированиеРеквизитов",
      "ФормаУстановкиИнтервала",
      "ФормаУстановкиЗначенийОтбора",
      "КонтрольУникальности",
      "НастройкиПараметровКопированияДополнительныхДанных",
      "СоглашенияСПоставщикамиПоХарактеристикам",
    ],
  },
} as MetadataCatalogContext

// const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")
const metadataCatalogContent = readFileSync(join(__dirname, "Before/Контрагенты.xml"), "utf-8")

describe("DO test", () => {
  it("should import metadata catalog from XML", () => {
    const importedXml = xmlImport<{ MetaDataObject: MetadataCatalogXML }>(metadataCatalogContent)

    const xmlData = importMetadataCatalogFromXML(mockСontext, importedXml.MetaDataObject)

    const exportedEnterprise = exportMetadataCatalogToEnterprise(mockСontext, xmlData)

    const yamlString = stringify(exportedEnterprise!, {
      indent: 2,
      lineWidth: 0,
    }).trim()

    writeFileSync(join(__dirname, "After/Контрагенты.yml"), yamlString, "utf-8")

    const newData = importMetadataCatalogFromEnterprise(mockСontext, exportedEnterprise, "Номенклатура")
    const newXml = exportMetadataCatalogToXML(mockMetadataCatalogContext, newData)

    const newXmlString = xmlExport({ MetaDataObject: newXml })

    writeFileSync(join(__dirname, "After/Контрагенты.xml"), newXmlString, "utf-8")
  })

  // it("should export schema ", () => {
  //   const catalogSchema = typia.json.schemas<[MetadataCatalogEnterprise], "3.1">()

  //   writeFileSync(join(__dirname, "After/Контрагенты.json"), typia.json.stringify(catalogSchema), "utf-8")
  // })
  // it("should round-trip DO XML", () => {
  //   const importedXml = xmlImport<{ Form: ClientApplicationFormXML }>(originalContent)
  //   const form = importClientApplicationFormFromXML(mockcontext, importedXml.Form)

  //   // const exportedForm = exportClientApplicationFormToXML(form)

  //   const formattedForm = exportClientApplicationFormToEnterprise(mockcontext, form)

  //   // const exportedXml = xmlExport(
  //   //   { Form: exportedForm },
  //   //   z.object({ Form: ZClientApplicationFormXML })
  //   // )

  //   // writeFileSync(join(__dirname, "FormOut.xml"), exportedXml, "utf-8")
  //   writeFileSync(join(__dirname, "FormFormatted.txt"), formattedForm.strings.join("\n"), "utf-8")
  //   // expect(exportedXml).toEqual(originalContent)
  // })

  it("should round-trip DO with parsing", () => {
    // const importedXml = xmlImport<{ Form: ClientApplicationFormXML }>(originalContent)
    // const form = importClientApplicationFormFromXML(mockcontext, importedXml.Form)
    // // const exportedForm = exportClientApplicationFormToXML(form)
    // const formattedForm = exportClientApplicationFormToEnterprise(mockcontext, form)
    // const parsedForm = parse(formattedForm.strings.join("\n"))
    // const exportedXml = xmlExport({ Form: parsedForm })
    // expect(exportedXml).toEqual(originalContent)
  })
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
