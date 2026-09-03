import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { normalizeTextBytes, normalizeXmlLineEndings } from "./normalize-xml-line-endings.mjs"

test("UTF-8, BOM, кириллица, смешанные переносы и идемпотентность", () => {
  for (const bom of ["", "\uFEFF"]) {
    const result = normalizeTextBytes(Buffer.from(`${bom}Текст\r\nещё\n\rодин\r\n`))
    assert.equal(result.reason, undefined)
    assert.equal(result.bytes.toString(), `${bom}Текст\nещё\n\rодин\n`)
    assert.equal(result.changed, true)
    assert.equal(normalizeTextBytes(result.bytes).changed, false)
  }
})

test("неизвестная кодировка и бинарные управляющие байты не преобразуются", () => {
  for (const source of [Buffer.from([0xff, 13, 10]), Buffer.from([65, 0, 13, 10])]) {
    const result = normalizeTextBytes(source)
    assert.equal(result.changed, false)
    assert.ok(result.reason)
    assert.equal(result.bytes, source)
  }
})

test("обход: allowlist, Git binary, ссылки и служебный каталог", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "nkdk-normalize-test-"))
  t.after(() => rm(root, { recursive: true, force: true }))
  const dir = join(root, "source")
  await mkdir(dir)
  execFileSync("git", ["init", "-q", dir])
  await writeFile(join(dir, ".gitattributes"), "binary.xml -text\ndiff.xml -diff\nmacro.xml binary\n")
  const contents = new Map([
    ["form.xml", Buffer.from("\uFEFF<Форма/>\r\n")],
    ["module.bsl", Buffer.from("Сообщить(1);\r\n")],
    ...["image.png", "Interface.bin", "archive.zip", "unknown.xyz", "binary.xml", "diff.xml", "macro.xml", ".git/probe.xml"].map((path) => [path, Buffer.from("ASCII\r\n")]),
    ["encoding.xml", Buffer.from([0xff, 13, 10])],
  ])
  for (const [path, bytes] of contents) await writeFile(join(dir, path), bytes)
  await writeFile(join(root, "outside.xml"), "outside\r\n")
  let linked = false
  try {
    await symlink(join(root, "outside.xml"), join(dir, "linked.xml"))
    linked = true
  } catch (error) {
    if (process.platform !== "win32" || error.code !== "EPERM") throw error
    t.diagnostic("Проверка ссылки недоступна: Windows требует права создания symlink")
  }
  const result = await normalizeXmlLineEndings(dir)
  assert.equal(result.changed, 2)
  assert.ok(result.skipped.some((item) => item.path === "encoding.xml" && /кодировк/u.test(item.reason)))
  if (linked) assert.ok(result.skipped.some((item) => item.path === "linked.xml"))
  for (const [path, bytes] of contents) {
    assert.deepEqual(await readFile(join(dir, path)), ["form.xml", "module.bsl"].includes(path)
      ? Buffer.from(bytes.toString().replaceAll("\r\n", "\n")) : bytes)
  }
  assert.equal(await readFile(join(root, "outside.xml"), "utf8"), "outside\r\n")
  assert.equal((await normalizeXmlLineEndings(dir)).changed, 0)
  assert.equal(execFileSync("git", ["-C", dir, "diff", "--cached", "--name-only"], { encoding: "utf8" }), "")
})
