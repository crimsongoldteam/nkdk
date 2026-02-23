import { exportCatalogsFromDirectory } from "../core/export/exportCatalog"
import { exportFormsFromDirectory } from "../core/export/exportForm"

export const exportConfigToXML = async (inputPath: string, outputPath: string): Promise<void> => {
  exportCatalogsFromDirectory(inputPath, outputPath)
  await exportFormsFromDirectory(inputPath, outputPath)
}
