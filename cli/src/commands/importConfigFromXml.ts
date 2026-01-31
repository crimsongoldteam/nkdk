import { importCatalogsFromDirectory } from "../core/import/importCatalog"

export const importConfigFromXml = (inputPath: string, outputPath: string) => {
  importCatalogsFromDirectory(inputPath, outputPath)
}
