// import { ConfigurationContext } from "~/metadata/context/types"
// import { ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/types"
// import { importFromYAMLFile } from "~/yaml/import"

// export const readForm = async (params: {
//   context: ConfigurationContext
//   formYAMLFilename: string
//   outputPath: string
//   formName: string
// }): Promise<ClientApplicationFormYAML> => {
//   const { context, formYAMLFilename: formYAMLFilename, outputPath, formName } = params

//   const formYAML = await importFromYAMLFile<ClientApplicationFormYAML>(formYAMLFilename)

//   return formYAML

//   // // Читаем файл структуры (.nkdk), если он существует
//   // const formDir = dirname(formYAMLFilename)
//   // const nkdkPath = join(formDir, "Форма.nkdk")
//   // let childItemsStructure = ""
//   // if (existsSync(nkdkPath)) {
//   //   childItemsStructure = readFileSync(nkdkPath, "utf-8")
//   // }

//   const nkdkAst = await parseNKDKFromString(childItemsStructure)
//   // const sourceForm = nkdkAst
//   //   ? importClientApplicationFromFromNKDK({ context, value: nkdkAst })
//   //   : createEmptyClientApplicationForm()
//   // if (!sourceForm) {
//   //   throw new Error("Не удалось построить исходную форму из NKDK")
//   // }

//   // const formData = importClientApplicationFormFromYAML(context, formYAML, sourceForm)

//   // if (!formData) {
//   //   throw new Error("Не удалось импортировать форму из Enterprise формата")
//   // }

//   // // Экспортируем Form.xml
//   // const formXmlData = exportClientApplicationFormToXML(context, formData)
//   // if (!formXmlData) {
//   //   throw new Error("Не удалось экспортировать форму в XML")
//   // }

//   // const formXmlString = xmlExport({ Form: formXmlData })
//   // const formOutputDir = join(outputPath, formName, "Ext")
//   // mkdirSync(formOutputDir, { recursive: true })
//   // writeFileSync(join(formOutputDir, "Form.xml"), formXmlString, "utf-8")

//   // // Экспортируем Metadata.xml
//   // const formMetadataXmlData = exportFormMetadataToXML(context, undefined, formData, formName)
//   // const formMetadataXmlString = xmlExport({ MetaDataObject: formMetadataXmlData })
//   // writeFileSync(join(outputPath, `${formName}.xml`), formMetadataXmlString, "utf-8")
// }
