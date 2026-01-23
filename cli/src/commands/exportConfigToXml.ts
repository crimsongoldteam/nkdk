import { exportCatalogsFromDirectory } from "../core/export/exportCatalog.js"
import { exportFormsFromDirectory } from "../core/export/exportForm.js"

export const exportConfigToXML = (inputPath: string, outputPath: string) => {
  exportCatalogsFromDirectory(inputPath, outputPath)
  exportFormsFromDirectory(inputPath, outputPath)
}
