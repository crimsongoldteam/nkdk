import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs"
import { join } from "path"

/**
 * Ищет все XML файлы в каталоге inputPath/Forms и создает для каждого пустой файл Form.yaml
 * @param inputPath - путь к входящему каталогу
 * @param outputPath - путь к исходящему каталогу
 */
export const importFormsFromDirectory = (inputPath: string, outputPath: string) => {
  const formsPath = join(inputPath, "Forms")

  if (!existsSync(formsPath)) {
    return
  }

  const entries = readdirSync(formsPath, { withFileTypes: true })
  const xmlFiles = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".xml"))

  if (xmlFiles.length === 0) {
    console.log("XML файлы не найдены в папке Forms")
    return
  }

  for (const entry of xmlFiles) {
    const nameWithoutExtension = entry.name.replace(/\.xml$/i, "")
    const outputFilePath = join(outputPath, "Forms", nameWithoutExtension)
    const outputFileYmlPath = join(outputFilePath, "Form.yaml")

    mkdirSync(outputFilePath, { recursive: true })
    writeFileSync(outputFileYmlPath, "", "utf-8")
  }
}

export const importForm = (inputPath: string, outputPath: string) => {
  importFormsFromDirectory(inputPath, outputPath)
}
