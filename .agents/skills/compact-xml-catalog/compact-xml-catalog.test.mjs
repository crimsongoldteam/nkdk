import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import test, { afterEach } from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { compactXmlCatalog } from "./compact-xml-catalog.mjs"

const execFileAsync = promisify(execFile)
const scriptPath = fileURLToPath(new URL("./compact-xml-catalog.mjs", import.meta.url))
const tempRoots = []

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), "compact-xml-catalog-"))
  tempRoots.push(root)

  const input = path.join(root, "input")
  const output = path.join(root, "output")
  await mkdir(path.join(input, "nested", "empty"), { recursive: true })
  await writeFile(path.join(input, "root.xml"), "<root>данные</root>")
  await writeFile(path.join(input, "ConfigDumpInfo.xml"), "root config")
  await writeFile(path.join(input, "Template.xml"), "<template>root</template>")
  await writeFile(path.join(input, "nested", "upper.XML"), Buffer.from([0, 1, 2, 255]))
  await writeFile(path.join(input, "nested", "configdumpinfo.XML"), "nested config")
  await writeFile(path.join(input, "nested", "TEMPLATE.XML"), "<template>nested</template>")
  await writeFile(path.join(input, "nested", "module.bsl"), 'Сообщить("test");')

  return { root, input, output }
}

test("copies XML bytes and empties other files", async () => {
  const { input, output } = await createFixture()
  await mkdir(output)
  await writeFile(path.join(output, "stale.txt"), "stale")

  const result = await compactXmlCatalog(input, output)

  assert.equal(await readFile(path.join(output, "root.xml"), "utf8"), "<root>данные</root>")
  assert.deepEqual(await readFile(path.join(output, "nested", "upper.XML")), Buffer.from([0, 1, 2, 255]))
  await assert.rejects(stat(path.join(output, "ConfigDumpInfo.xml")), { code: "ENOENT" })
  await assert.rejects(stat(path.join(output, "nested", "configdumpinfo.XML")), { code: "ENOENT" })
  assert.equal((await stat(path.join(output, "Template.xml"))).size, 0)
  assert.equal((await stat(path.join(output, "nested", "TEMPLATE.XML"))).size, 0)
  assert.equal((await stat(path.join(output, "nested", "module.bsl"))).size, 0)
  await assert.rejects(stat(path.join(output, "stale.txt")), { code: "ENOENT" })
  assert.equal((await stat(path.join(output, "nested", "empty"))).isDirectory(), true)
  assert.deepEqual(
    {
      xmlFiles: result.xmlFiles,
      emptiedFiles: result.emptiedFiles,
      excludedFiles: result.excludedFiles,
      directories: result.directories,
      inputBytes: result.inputBytes,
      outputBytes: result.outputBytes,
    },
    {
      xmlFiles: 2,
      emptiedFiles: 3,
      excludedFiles: 2,
      directories: 3,
      inputBytes:
        Buffer.byteLength("<root>данные</root>") +
        Buffer.byteLength("root config") +
        Buffer.byteLength("<template>root</template>") +
        4 +
        Buffer.byteLength("nested config") +
        Buffer.byteLength("<template>nested</template>") +
        Buffer.byteLength('Сообщить("test");'),
      outputBytes: Buffer.byteLength("<root>данные</root>") + 4,
    }
  )
})

test("rejects unsafe paths", async () => {
  const { input } = await createFixture()

  await assert.rejects(compactXmlCatalog(input, input), /must differ/)
  await assert.rejects(compactXmlCatalog(input, path.join(input, "compact")), /inside input/)
  await assert.rejects(compactXmlCatalog(input, path.dirname(input)), /input directory must not be inside output/)
  await assert.rejects(compactXmlCatalog(path.join(input, "missing"), path.join(input, "..", "out")), /input directory/)
})

test("rejects symbolic links before clearing output", async (t) => {
  const { input, output } = await createFixture()
  await mkdir(output)
  await writeFile(path.join(output, "sentinel.txt"), "keep")

  try {
    await symlink(path.join(input, "root.xml"), path.join(input, "link.xml"))
  } catch (error) {
    if (error.code === "EPERM") {
      t.skip("symbolic links are unavailable")
      return
    }
    throw error
  }

  await assert.rejects(compactXmlCatalog(input, output), /symbolic link/)
  assert.equal(await readFile(path.join(output, "sentinel.txt"), "utf8"), "keep")
})

test("CLI prints the result as JSON", async () => {
  const { input, output } = await createFixture()

  const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath, input, output])
  const result = JSON.parse(stdout)

  assert.equal(stderr, "")
  assert.equal(result.inputPath, input)
  assert.equal(result.outputPath, output)
  assert.equal(result.xmlFiles, 2)
  assert.equal(result.emptiedFiles, 3)
  assert.equal(result.excludedFiles, 2)
})

test("CLI requires exactly two paths", async () => {
  await assert.rejects(execFileAsync(process.execPath, [scriptPath]), (error) => {
    assert.equal(error.code, 1)
    assert.match(error.stderr, /Usage:/)
    return true
  })
})

test("CLI rejects an empty output path before touching files", async () => {
  const { root, input } = await createFixture()
  const sentinel = path.join(root, "sentinel.txt")
  await writeFile(sentinel, "keep")

  await assert.rejects(execFileAsync(process.execPath, [scriptPath, input, ""], { cwd: root }), (error) => {
    assert.equal(error.code, 1)
    assert.match(error.stderr, /non-empty/)
    return true
  })
  assert.equal(await readFile(sentinel, "utf8"), "keep")
})

test("rejects an output made nested by a directory junction", async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), "compact-xml-junction-"))
  tempRoots.push(root)

  const input = path.join(root, "actual")
  const alias = path.join(root, "alias")
  const canonicalOutput = path.join(input, "compact")
  const sentinel = path.join(canonicalOutput, "sentinel.txt")
  await mkdir(canonicalOutput, { recursive: true })
  await writeFile(path.join(input, "root.xml"), "<root/>")
  await writeFile(sentinel, "keep")

  try {
    await symlink(input, alias, "junction")
  } catch (error) {
    if (error.code === "EPERM") {
      t.skip("directory junctions are unavailable")
      return
    }
    throw error
  }

  await assert.rejects(compactXmlCatalog(input, path.join(alias, "compact")), /inside input/)
  assert.equal(await readFile(sentinel, "utf8"), "keep")
})
