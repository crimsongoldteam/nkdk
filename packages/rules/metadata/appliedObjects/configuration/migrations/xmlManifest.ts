import fs from "fs"
import { dirname, isAbsolute, join, relative, resolve, sep } from "path"

export class XmlSyncManifest {
  private readonly files = new Set<string>()

  constructor(private readonly xmlRoot: string) {}

  addFile(absPath: string): void {
    const rel = relative(resolve(this.xmlRoot), resolve(absPath))
    if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) return
    this.files.add(rel.split(sep).join("/"))
  }

  expectedFiles(): Set<string> {
    return new Set(this.files)
  }
}

export async function pruneXmlByManifest(params: {
  xmlRoot: string
  xmlDirs: string[]
  expectedFiles: Set<string>
}): Promise<void> {
  const expectedDirs = new Set<string>()
  for (const file of params.expectedFiles) {
    let dir = dirname(file).split(sep).join("/")
    while (dir !== "." && dir !== "") {
      expectedDirs.add(dir)
      dir = dirname(dir).split(sep).join("/")
    }
  }

  for (const xmlDir of params.xmlDirs) {
    const absDir = resolve(params.xmlRoot, xmlDir)
    const rel = relative(resolve(params.xmlRoot), absDir)
    if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) continue
    if (!fs.existsSync(absDir)) continue
    await pruneDir(params.xmlRoot, absDir, params.expectedFiles, expectedDirs)
  }
}

async function pruneDir(
  root: string,
  absDir: string,
  expectedFiles: Set<string>,
  expectedDirs: Set<string>
): Promise<void> {
  for (const entry of await fs.promises.readdir(absDir, { withFileTypes: true })) {
    const absPath = join(absDir, entry.name)
    const rel = relative(resolve(root), absPath).split(sep).join("/")
    if (rel === ".." || rel.startsWith("../") || isAbsolute(rel)) continue
    if (entry.isDirectory()) {
      await pruneDir(root, absPath, expectedFiles, expectedDirs)
      if (!expectedDirs.has(rel)) await fs.promises.rm(absPath, { recursive: true, force: true })
    } else if (entry.isFile() && !expectedFiles.has(rel)) {
      await fs.promises.rm(absPath)
    }
  }
}
