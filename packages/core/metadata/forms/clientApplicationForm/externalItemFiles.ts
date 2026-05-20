import fs from "fs"
import { dirname, extname, join } from "path"
import type { XmlSyncManifest } from "~/metadata/appliedObjects/configuration/migrations/xmlManifest"

const externalItemFileSpecs = [
  { xmlName: "Picture", nkdkDir: "Картинки" },
  { xmlName: "ValuesPicture", nkdkDir: "КартинкиЗначений" },
] as const

export async function copyFormItemExternalFilesFromXML(params: {
  formXmlDir: string
  formNkdkDir: string
}): Promise<void> {
  const itemsDir = join(params.formXmlDir, "Ext", "Form", "Items")
  if (!fs.existsSync(itemsDir)) return

  for (const item of await fs.promises.readdir(itemsDir, { withFileTypes: true })) {
    if (!item.isDirectory()) continue
    const itemDir = join(itemsDir, item.name)
    const files = await fs.promises.readdir(itemDir, { withFileTypes: true })

    for (const spec of externalItemFileSpecs) {
      for (const file of files) {
        if (!file.isFile() || !file.name.startsWith(`${spec.xmlName}.`)) continue
        const ext = extname(file.name)
        if (ext === "") continue

        const src = join(itemDir, file.name)
        const dst = join(params.formNkdkDir, spec.nkdkDir, `${item.name}${ext}`)
        await fs.promises.mkdir(dirname(dst), { recursive: true })
        await fs.promises.copyFile(src, dst)
      }
    }
  }
}

export async function copyFormItemExternalFilesToXML(params: {
  formNkdkDir: string
  formXmlDir: string
  xmlManifest?: XmlSyncManifest
}): Promise<void> {
  for (const spec of externalItemFileSpecs) {
    const srcDir = join(params.formNkdkDir, spec.nkdkDir)
    if (!fs.existsSync(srcDir)) continue

    for (const file of await fs.promises.readdir(srcDir, { withFileTypes: true })) {
      if (!file.isFile()) continue
      const ext = extname(file.name)
      if (ext === "") continue

      const itemName = file.name.slice(0, -ext.length)
      const src = join(srcDir, file.name)
      const dst = join(params.formXmlDir, "Ext", "Form", "Items", itemName, `${spec.xmlName}${ext}`)
      await fs.promises.mkdir(dirname(dst), { recursive: true })
      await fs.promises.copyFile(src, dst)
      params.xmlManifest?.addFile(dst)
    }
  }
}
