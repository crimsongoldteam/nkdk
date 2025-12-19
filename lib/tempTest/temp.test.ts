import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { describe, it } from "vitest"
import { stringify } from "yaml"
import { exportMetadataCatalogToEnterprise } from "../metadata/appliedObjects/metadataCatalog/exportToEnterprise"
import { importMetadataCatalogFromXML } from "../metadata/appliedObjects/metadataCatalog/importFromXML"
import { MetadataCatalogXML } from "../metadata/appliedObjects/metadataCatalog/types"
import "../metadata/forms/elements/exportToXML"
import "../metadata/forms/elements/importFromXML"
import { mockConfigurationSettings } from "../tests/mockConfigurationSettings"
import xmlImport from "../xml/import/importer"

// const originalContent = readFileSync(join(__dirname, "Form.xml"), "utf-8")
const metadataCatalogContent = readFileSync(join(__dirname, "Before/Контрагенты.xml"), "utf-8")

describe("DO test", () => {
  it("should import metadata catalog from XML", () => {
    const importedXml = xmlImport<{ MetaDataObject: MetadataCatalogXML }>(metadataCatalogContent)

    const xmlData = importMetadataCatalogFromXML(importedXml.MetaDataObject, mockConfigurationSettings)

    const exportedEnterprise = exportMetadataCatalogToEnterprise(xmlData, mockConfigurationSettings)

    const yamlString = stringify(exportedEnterprise!, {
      indent: 2,
      lineWidth: 0,
    }).trim()

    writeFileSync(join(__dirname, "After/Контрагенты.yml"), yamlString, "utf-8")
  })
  // it("should round-trip DO XML", () => {
  //   const importedXml = xmlImport<{ Form: ClientApplicationFormXML }>(originalContent)
  //   const form = importClientApplicationFormFromXML(importedXml.Form, mockConfigurationSettings)

  //   // const exportedForm = exportClientApplicationFormToXML(form)

  //   const formattedForm = exportClientApplicationFormToEnterprise(form, mockConfigurationSettings)

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
    // const form = importClientApplicationFormFromXML(importedXml.Form, mockConfigurationSettings)
    // // const exportedForm = exportClientApplicationFormToXML(form)
    // const formattedForm = exportClientApplicationFormToEnterprise(form, mockConfigurationSettings)
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
