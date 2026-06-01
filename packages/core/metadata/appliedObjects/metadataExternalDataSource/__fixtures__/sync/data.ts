import fs from "fs"
import { join } from "path"

export const readExternalDataSourceYAML = fs.readFileSync(
  join(import.meta.dirname, "yaml/ВнешнийИсточникДанныхВсеСвойства/Свойства.yaml"),
  "utf-8"
)
