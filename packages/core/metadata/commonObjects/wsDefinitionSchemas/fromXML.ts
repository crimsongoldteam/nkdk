import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "../../orchestration"
import type { PropertyRule } from "../../orchestration/property/types"

export const syncWSDefinitionSchemasFromXML = async (params: {
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  name?: string
}): Promise<void> => {
  const srcDir = resolveExtDir({ xmlDir: params.xmlDir, objectName: params.name })
  if (!fs.existsSync(srcDir)) return

  const entries = await fs.promises.readdir(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".xsd")) continue

    const srcPath = join(srcDir, entry.name)
    const dstPath = join(params.nkdkDir, "XSD", entry.name)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
  }
}

registerTypeRule("WSDefinitionSchemas", "syncExternalFromXML", syncWSDefinitionSchemasFromXML)
const resolveExtDir = (params: { xmlDir: string; objectName?: string }): string => {
  const rootExtDir = join(params.xmlDir, "Ext")
  if (fs.existsSync(rootExtDir) || !params.objectName) return rootExtDir

  return join(params.xmlDir, params.objectName, "Ext")
}
