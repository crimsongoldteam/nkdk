import { exportCatalogsFromDirectory } from "../core/export/exportCatalog.js"

export const exportConfigToXML = (inputPath: string, outputPath: string) => {
  exportCatalogsFromDirectory(inputPath, outputPath)
}
