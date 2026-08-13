import fs from "node:fs"

export const temporaryDirectoryFileSystem = {
  async mkdir(path: string): Promise<void> {
    await fs.promises.mkdir(path, { recursive: true })
  },
  async rm(path: string): Promise<void> {
    await fs.promises.rm(path, { recursive: true, force: true })
  },
}
