import assert from "node:assert/strict"
import { describe, it } from "node:test"

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
