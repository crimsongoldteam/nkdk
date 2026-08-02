import fs from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { fingerprintRulesSourceTree } from "./rulesSourceFingerprint.mjs"

describe("rules source fingerprint", () => {
  const directories: string[] = []

  afterEach(async () => {
    await Promise.all(directories.splice(0).map((directory) => fs.promises.rm(directory, { recursive: true })))
  })

  it("учитывает только транзитивные production-imports и обходит циклы", async () => {
    const workspace = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-rules-graph-"))
    directories.push(workspace)
    const root = join(workspace, "root")
    await write(root, "register.ts", 'import "./handler"\nimport "../outside"\nimport "external-package"\n')
    await write(root, "handler.ts", 'import "./register"\nexport const handler = () => "first"\n')
    await write(root, "projectState/lifecycle.ts", "export const lifecycle = 'first'\n")
    await write(root, "common/__fixtures__/sample.ts", "export const fixture = 'first'\n")
    await write(workspace, "outside.ts", "export const outside = 'first'\n")
    const initial = fingerprintRulesSourceTree(root, ["register.ts"])

    await write(root, "projectState/lifecycle.ts", "export const lifecycle = 'second'\n")
    await write(root, "common/__fixtures__/sample.ts", "export const fixture = 'second'\n")
    await write(workspace, "outside.ts", "export const outside = 'second'\n")
    expect(fingerprintRulesSourceTree(root, ["register.ts"])).toBe(initial)

    await write(root, "handler.ts", 'import "./register"\nexport const handler = () => "second"\n')
    expect(fingerprintRulesSourceTree(root, ["register.ts"])).not.toBe(initial)
  })
})

async function write(root: string, path: string, content: string): Promise<void> {
  const target = join(root, path)
  await fs.promises.mkdir(join(target, ".."), { recursive: true })
  await fs.promises.writeFile(target, content)
}
