import fs from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export function trackTempProjectDirs(prefix: string) {
  const directories: string[] = []
  return {
    create: async (): Promise<string> => {
      const directory = await fs.promises.mkdtemp(join(tmpdir(), prefix))
      directories.push(directory)
      return directory
    },
    removeAll: async (): Promise<void> => {
      await Promise.all(directories.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true })))
    },
  }
}
