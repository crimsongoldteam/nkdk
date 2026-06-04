import fs from "fs"
import { join } from "path"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"

const rootExternalDataSourceYAML = fs.readFileSync(
  join(import.meta.dirname, "yaml/ВнешнийИсточникДанныхВсеСвойства/Свойства.yaml"),
  "utf-8"
)
const rootExternalDataSourceModel = importFromYAML<Record<string, unknown>>(rootExternalDataSourceYAML)
delete rootExternalDataSourceModel["Таблицы"]
delete rootExternalDataSourceModel["Кубы"]

export const readExternalDataSourceYAML = exportToYAML(rootExternalDataSourceModel)
