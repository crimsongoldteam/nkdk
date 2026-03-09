// import { parseNKDKFromString } from "../../langium/util"

/**
 * Экспортирует форму из Enterprise формата в XML
 * @param inputPath - путь к YAML файлу формы (например, .../Формы/FormName/Форма.yaml)
 * @param outputPath - путь к директории для вывода XML файлов (например, .../Forms)
 * @param formName - имя формы для использования в метаданных
 */
export const exportForm = async (inputPath: string, outputPath: string, formName: string): Promise<void> => {
  // const context = {
  //   defaultLanguage: "ru",
  //   testMode: true,
  // }
  // const yamlContent = readFileSync(inputPath, "utf-8")
  // const enterpriseData = importFromYAML(yamlContent) as ClientApplicationFormYAML
  // if (!enterpriseData) {
  //   throw new Error("Не удалось распарсить YAML")
  // }
  // // Читаем файл структуры (.nkdk), если он существует
  // const formDir = dirname(inputPath)
  // const nkdkPath = join(formDir, "Форма.nkdk")
  // let childItemsStructure = ""
  // if (existsSync(nkdkPath)) {
  //   childItemsStructure = readFileSync(nkdkPath, "utf-8")
  // }
  // const nkdkAst = await parseNKDKFromString(childItemsStructure)
  // const sourceForm = nkdkAst
  //   ? importClientApplicationFromFromNKDK({ context, value: nkdkAst })
  //   : createEmptyClientApplicationForm()
  // if (!sourceForm) {
  //   throw new Error("Не удалось построить исходную форму из NKDK")
  // }
  // const formData = importClientApplicationFormFromYAML(context, enterpriseData, sourceForm)
  // if (!formData) {
  //   throw new Error("Не удалось импортировать форму из Enterprise формата")
  // }
  // // Экспортируем Form.xml
  // const formXmlData = exportClientApplicationFormToXML(context, formData)
  // if (!formXmlData) {
  //   throw new Error("Не удалось экспортировать форму в XML")
  // }
  // const formXmlString = xmlExport({ Form: formXmlData })
  // const formOutputDir = join(outputPath, formName, "Ext")
  // mkdirSync(formOutputDir, { recursive: true })
  // writeFileSync(join(formOutputDir, "Form.xml"), formXmlString, "utf-8")
  // // Экспортируем Metadata.xml
  // const formMetadataXmlData = exportFormMetadataToXML(context, undefined, formData, formName)
  // const formMetadataXmlString = xmlExport({ MetaDataObject: formMetadataXmlData })
  // writeFileSync(join(outputPath, `${formName}.xml`), formMetadataXmlString, "utf-8")
}

/**
 * Ищет все YAML файлы форм внутри каталогов в inputPath/Справочник и обрабатывает их через exportForm
 * @param inputPath - путь к входящему каталогу
 * @param outputPath - путь к исходящему каталогу
 */
export const exportFormsFromDirectory = async (inputPath: string, outputPath: string): Promise<void> => {
  // const catalogsPath = join(inputPath, "Справочник")
  // if (!existsSync(catalogsPath)) {
  //   return
  // }
  // const entries = readdirSync(catalogsPath, { withFileTypes: true })
  // const catalogDirs = entries.filter((entry) => entry.isDirectory())
  // if (catalogDirs.length === 0) {
  //   return
  // }
  // // Ищем Форма.yaml файлы внутри каждого каталога в поддиректории Формы
  // const yamlFiles: Array<{ dir: string; path: string; catalogName: string }> = []
  // for (const catalogDir of catalogDirs) {
  //   const catalogDirPath = join(catalogsPath, catalogDir.name)
  //   const formsPath = join(catalogDirPath, "Формы")
  //   if (!existsSync(formsPath)) {
  //     continue
  //   }
  //   const formEntries = readdirSync(formsPath, { withFileTypes: true })
  //   const formDirs = formEntries.filter((entry) => entry.isDirectory())
  //   for (const formDir of formDirs) {
  //     const formDirPath = join(formsPath, formDir.name)
  //     const formYamlPath = join(formDirPath, "Форма.yaml")
  //     if (existsSync(formYamlPath)) {
  //       yamlFiles.push({ dir: formDir.name, path: formYamlPath, catalogName: catalogDir.name })
  //     }
  //   }
  // }
  // if (yamlFiles.length === 0) {
  //   console.log("YAML файлы не найдены")
  //   return
  // }
  // const progressBar = new cliProgress.SingleBar(
  //   {
  //     format: "Экспорт форм |{bar}| {percentage}% | {value}/{total} файлов | {file}",
  //     barCompleteChar: "\u2588",
  //     barIncompleteChar: "\u2591",
  //     hideCursor: true,
  //   },
  //   cliProgress.Presets.shades_classic
  // )
  // progressBar.start(yamlFiles.length, 0, { file: "" })
  // const errors: Array<{ file: string; error: string }> = []
  // let processedCount = 0
  // try {
  //   for (let i = 0; i < yamlFiles.length; i++) {
  //     const { dir, path: inputFile, catalogName } = yamlFiles[i]
  //     const formsOutputPath = join(outputPath, "Catalogs", catalogName, "Forms")
  //     const fileName = `${catalogName}/Формы/${dir}/Форма.yaml`
  //     try {
  //       mkdirSync(formsOutputPath, { recursive: true })
  //       await exportForm(inputFile, formsOutputPath, dir)
  //       processedCount++
  //     } catch (error) {
  //       let errorMessage = "Неизвестная ошибка"
  //       if (error instanceof Error) {
  //         errorMessage = error.message
  //         const firstLine = errorMessage.split("\n")[0]
  //         errorMessage = firstLine.length > 100 ? firstLine.substring(0, 97) + "..." : firstLine
  //       } else {
  //         errorMessage = String(error).split("\n")[0]
  //       }
  //       errors.push({ file: inputFile, error: errorMessage })
  //     }
  //     progressBar.update(i + 1, { file: fileName })
  //   }
  // } finally {
  //   progressBar.stop()
  // }
  // console.log("")
  // if (errors.length > 0) {
  //   console.log(`⚠  Обработано: ${processedCount}/${yamlFiles.length} файлов`)
  //   console.log(`❌ Ошибок: ${errors.length}`)
  //   console.log("")
  //   console.log("Файлы с ошибками:")
  //   errors.forEach((err, index) => {
  //     const relativePath = relative(process.cwd(), err.file)
  //     console.log(`  ${index + 1}. ${relativePath}`)
  //     console.log(`     ${err.error}`)
  //     if (index < errors.length - 1) {
  //       console.log("")
  //     }
  //   })
  // } else {
  //   console.log(`✓ Успешно обработано: ${processedCount}/${yamlFiles.length} файлов`)
  // }
}
