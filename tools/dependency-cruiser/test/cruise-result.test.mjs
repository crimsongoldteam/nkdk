import assert from "node:assert/strict"
import test from "node:test"
import {
  assertCompleteCruiseResult,
  dependencyCruiseArgs,
} from "../src/cruise-result.mjs"

const typescriptEnvironment = {
  transpilersFound: [
    {
      name: "typescript",
      available: true,
      currentVersion: "typescript@6.0.3",
    },
  ],
  extensionsFound: [
    { extension: ".ts", available: true },
    { extension: ".tsx", available: true },
    { extension: ".d.ts", available: true },
  ],
}

test("всегда строит dependency-граф без кэша", () => {
  assert.deepEqual(dependencyCruiseArgs("/tmp/current.json"), [
    "--config",
    ".dependency-cruiser.mjs",
    "--output-type",
    "json",
    "--output-to",
    "/tmp/current.json",
    "--no-cache",
    "packages",
  ])
})

test("принимает полный TypeScript-граф", () => {
  assert.doesNotThrow(() =>
    assertCompleteCruiseResult({
      summary: {
        totalCruised: 2052,
        totalDependenciesCruised: 9456,
        environment: typescriptEnvironment,
      },
    })
  )
})

test("отклоняет почти пустой граф несовместимого TypeScript", () => {
  assert.throws(
    () =>
      assertCompleteCruiseResult({
        summary: { totalCruised: 16, totalDependenciesCruised: 7 },
      }),
    /Неполный dependency-граф: 16 модулей/u
  )
})

test("отклоняет большой граф без TypeScript-парсера", () => {
  assert.throws(
    () =>
      assertCompleteCruiseResult({
        summary: {
          totalCruised: 2052,
          totalDependenciesCruised: 9456,
          environment: {
            transpilersFound: [{ name: "typescript", available: false }],
            extensionsFound: [],
          },
        },
      }),
    /TypeScript-парсер dependency-cruiser недоступен/u
  )
})
