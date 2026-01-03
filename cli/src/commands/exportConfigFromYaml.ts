import { exportCatalogsFromDirectory } from "../core/export/exportCatalog.js"

export const exportConfigFromYaml = (inputPath: string, outputPath: string) => {
  exportCatalogsFromDirectory(inputPath, outputPath)
}
