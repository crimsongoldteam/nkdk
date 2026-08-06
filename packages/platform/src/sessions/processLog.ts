import fs from "node:fs"

export type ProcessLogCursor = {
  identity: string
  size: number
}

export interface ProcessLogFileSystem {
  info(path: string): Promise<ProcessLogCursor>
  readRange(path: string, start: number, length: number): Promise<string>
}

export interface ProcessLogReader {
  capture(path: string): Promise<ProcessLogCursor>
  readSince(path: string, cursor?: ProcessLogCursor): Promise<string>
}

export function createProcessLogReader(
  fileSystem: ProcessLogFileSystem
): ProcessLogReader {
  return {
    capture: (path) => fileSystem.info(path),
    async readSince(path, cursor) {
      const current = await fileSystem.info(path)
      const start =
        cursor !== undefined &&
        cursor.identity === current.identity &&
        current.size >= cursor.size
          ? cursor.size
          : 0
      return fileSystem.readRange(path, start, current.size - start)
    },
  }
}

export const nodeProcessLogReader = createProcessLogReader({
  async info(path) {
    const stats = await fs.promises.stat(path)
    return {
      identity: `${stats.dev}:${stats.ino}`,
      size: stats.size,
    }
  },
  async readRange(path, start, length) {
    if (length === 0) return ""
    const handle = await fs.promises.open(path, "r")
    try {
      const buffer = Buffer.alloc(length)
      let totalRead = 0
      while (totalRead < length) {
        const { bytesRead } = await handle.read(
          buffer,
          totalRead,
          length - totalRead,
          start + totalRead
        )
        if (bytesRead === 0) break
        totalRead += bytesRead
      }
      return buffer.subarray(0, totalRead).toString("utf8")
    } finally {
      await handle.close()
    }
  },
})
