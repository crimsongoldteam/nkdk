import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { execFileSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { findNewDuplicates } from "./check-new-duplicates.mjs"
import { resolveNodePackageBinary } from "./node-package-binary.mjs"

const clone = (fingerprint) => ({
  fingerprint,
  firstFile: { name: `${fingerprint}-a.ts` },
  secondFile: { name: `${fingerprint}-b.ts` },
})

describe("findNewDuplicates", () => {
  it("не считает существующий дубль новым", () => {
    assert.deepEqual(findNewDuplicates([clone("old")], [clone("old")]), [])
  })

  it("возвращает только новый отпечаток", () => {
    assert.deepEqual(
      findNewDuplicates([clone("old")], [clone("old"), clone("new")]),
      [clone("new")]
    )
  })

  it("учитывает увеличение числа пар с тем же отпечатком", () => {
    assert.deepEqual(
      findNewDuplicates([clone("copy")], [clone("copy"), clone("copy")]),
      [clone("copy")]
    )
  })

  it("не считает дубль новым при изменении только его границ", () => {
    const shared = "one\ntwo\nthree\nfour\nfive"
    const base = [
      {
        fingerprint: "base",
        fragments: [`before\n${shared}`, `other-before\n${shared}`],
      },
    ]
    const current = [
      {
        fingerprint: "current",
        fragments: [`${shared}\nafter`, `${shared}\nother-after`],
      },
    ]

    assert.deepEqual(findNewDuplicates(base, current), [])
  })

  it("не считает дубль новым после переноса импортируемых модулей", () => {
    const baseFragment = [
      'import { booleanRule } from "../commonObjects/boolean"',
      'import { numberRule } from "../commonObjects/number"',
      'import { registerRule } from "../orchestration/ruleFactory"',
      'import type { Rule } from "../orchestration/types"',
      'import { shared } from "../old/shared"',
      'const properties = ["Properties"]',
      'const children = ["Children"]',
      'export const rules = { properties, children }',
    ].join("\n")
    const currentFragment = [
      'import { booleanRule } from "../commonObjects/boolean"',
      'import { numberRule } from "../commonObjects/number"',
      'import { registerRule } from "../ruleRuntime/ruleFactory"',
      'import type { Rule } from "../ruleRuntime/types"',
      'import { shared } from "../new/shared"',
      'const properties = ["Properties"]',
      'const children = ["Children"]',
      'export const rules = { properties, children }',
    ].join("\n")
    const base = [{ fingerprint: "base", fragments: [baseFragment, baseFragment] }]
    const current = [{ fingerprint: "current", fragments: [currentFragment, currentFragment] }]

    assert.deepEqual(findNewDuplicates(base, current), [])
  })

  it("считает дополнительную копию новым дублем после сопоставления старой", () => {
    const shared = "one\ntwo\nthree\nfour\nfive"
    const base = [{ fingerprint: "base", fragments: [shared, shared] }]
    const current = [
      { fingerprint: "current-1", fragments: [shared, shared] },
      { fingerprint: "current-2", fragments: [shared, shared] },
    ]

    assert.deepEqual(findNewDuplicates(base, current), [current[1]])
  })
})

describe("resolveNodePackageBinary", () => {
  it("находит JavaScript-точку входа CLI без платформенного shell-файла", () => {
    const binaryPath = resolveNodePackageBinary("jscpd", import.meta.url)

    assert.match(binaryPath.replaceAll("\\", "/"), /\/jscpd\/run-jscpd\.js$/)
  })
})

describe("jscpd: объявления import не являются дублированием логики", () => {
  const imports = `import Default from "one"
import type { One, Two, Three } from "two"
import {
  Alpha, Beta, Gamma, Delta, Epsilon,
  Zeta, Eta, Theta, Iota, Kappa,
} from "three"
import * as Utilities from "four"
import "side-effects"
import { booleanRule } from "./boolean/types"
import { i8nTextRule } from "./i8nText/types"
import { moduleRule } from "./module/types"
import { stringRule } from "./string/types"
import { xmlRootRule } from "./xmlRoot/types"
import { systemEnumerationRule } from "./systemEnumerations/types"
import { V8_MDCLASSES_ROOT } from "./presets"
import type { MetadataItemRule } from "./rule-kit"
`
  const logic = `export async function processItems(items) {
  const result = []
  for (const item of items) {
    const loader = await import(item.module)
    const value = loader.convert(item.value)
    if (value === undefined) {
      throw new Error("Missing converted value")
    }
    result.push({ name: item.name, value })
  }
  return result.filter(item => item.value !== null)
}
`

  for (const [label, source, hasDuplicates] of [
    ["только статические импорты, включая многострочные", imports, false],
    ["логика после импортов", imports + logic, true],
    ["динамический import остаётся исполняемым кодом", logic, true],
  ]) {
    it(label, async () => {
      const directory = await mkdtemp(join(tmpdir(), "nkdk-jscpd-import-test-"))
      try {
        await Promise.all(["first.ts", "second.ts"].map(name => writeFile(join(directory, name), source)))
        execFileSync(process.execPath, [
          resolveNodePackageBinary("jscpd", import.meta.url), directory,
          "--config", fileURLToPath(new URL("../.jscpd.json", import.meta.url)),
          "--reporters", "json", "--output", join(directory, "report"),
          "--exit-code", "0", "--silent", "--no-tips",
        ], { stdio: "pipe" })
        const report = JSON.parse(await readFile(join(directory, "report/jscpd-report.json"), "utf8"))
        assert.equal(report.duplicates.length > 0, hasDuplicates)
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    })
  }
})
