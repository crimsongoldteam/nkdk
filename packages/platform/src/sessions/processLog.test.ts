import { describe, expect, it } from "vitest"
import { createProcessLogReader } from "./processLog"

describe("process log reader", () => {
  it("reads only bytes appended after the captured cursor", async () => {
    const source = memorySource("old message\n", "file-1")
    const reader = createProcessLogReader(source.fileSystem)
    const cursor = await reader.capture("process.log")
    source.replace("old message\ncurrent message\n", "file-1")

    await expect(reader.readSince("process.log", cursor)).resolves.toBe(
      "current message\n"
    )
  })

  it.each([
    ["the file shrinks", "file-1", "short\n"],
    ["the file is replaced", "file-2", "replacement message\n"],
  ])(
    "reads the current file from the start when %s",
    async (_case, identity, current) => {
      const source = memorySource(
        "a sufficiently long previous message\n",
        "file-1"
      )
      const reader = createProcessLogReader(source.fileSystem)
      const cursor = await reader.capture("process.log")
      source.replace(current, identity)

      await expect(reader.readSince("process.log", cursor)).resolves.toBe(
        current
      )
    }
  )
})

function memorySource(initialContent: string, initialIdentity: string) {
  let content = initialContent
  let identity = initialIdentity
  return {
    fileSystem: {
      async info() {
        return { identity, size: Buffer.byteLength(content) }
      },
      async readRange(_path: string, start: number, length: number) {
        return Buffer.from(content)
          .subarray(start, start + length)
          .toString("utf8")
      },
    },
    replace(nextContent: string, nextIdentity: string) {
      content = nextContent
      identity = nextIdentity
    },
  }
}
