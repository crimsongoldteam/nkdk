import { exportCatalogsFromDirectory } from "../core/export/exportCatalog"
import { exportFormsFromDirectory } from "../core/export/exportForm"

export const exportConfigToXML = (inputPath: string, outputPath: string) => {
  exportCatalogsFromDirectory(inputPath, outputPath)
  exportFormsFromDirectory(inputPath, outputPath)
}
