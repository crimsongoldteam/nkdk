import fs from "fs"
import { dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { XmlWriteManifest } from "~/metadata/orchestration/xmlWriteManifest"

export const syncWSDefinitionSchemasToXML = async (params: {
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name?: string
  xmlManifest?: XmlWriteManifest
}): Promise<void> => {
  const srcDir = join(params.nkdkDir, "XSD")
  if (!fs.existsSync(srcDir)) return

  const entries = await fs.promises.readdir(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".xsd")) continue

    const srcPath = join(srcDir, entry.name)
    const dstPath = join(params.xmlDir, "Ext", entry.name)
    await fs.promises.mkdir(dirname(dstPath), { recursive: true })
    await fs.promises.copyFile(srcPath, dstPath)
    params.xmlManifest?.addFile(dstPath)
  }
}

registerTypeRule("WSDefinitionSchemas", "syncExternalToXML", syncWSDefinitionSchemasToXML)
