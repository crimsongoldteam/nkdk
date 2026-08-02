import assert from "node:assert/strict"
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { updateBaseline } from "../src/baseline.mjs"

test("не изменяет baseline при новом нарушении", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nkdk-baseline-"))
  const path = join(dir, "baseline.json")
  await writeFile(path, "old")

  await assert.rejects(
    updateBaseline({
      baselinePath: path,
      check: async () => {
        throw new Error("new violation")
      },
      generate: async () => {
        await writeFile(path, "new")
      },
    }),
    /new violation/u
  )
  assert.equal(await readFile(path, "utf8"), "old")
})

test("атомарно заменяет baseline после чистой проверки", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nkdk-baseline-"))
  const path = join(dir, "baseline.json")
  await writeFile(path, "old")

  await updateBaseline({
    baselinePath: path,
    check: async () => {},
    generate: async (temporaryPath) => {
      await writeFile(temporaryPath, "smaller")
    },
  })

  assert.equal(await readFile(path, "utf8"), "smaller")
})
