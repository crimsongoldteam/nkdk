import { importCatalogsFromDirectory } from "../core/import/importCatalog.js"

export const importConfigFromXml = (inputPath: string, outputPath: string) => {
  importCatalogsFromDirectory(inputPath, outputPath)
}
