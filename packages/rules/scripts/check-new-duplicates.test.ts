import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся JavaScript без декларации типов.
import * as checkNewDuplicates from "./check-new-duplicates.mjs"

const {
  findNewClones,
  parseAddedLineRanges,
  parseArguments,
  parseJscpdReport,
  runDuplicateCheck,
} = checkNewDuplicates

const temporaryDirectories: string[] = []

function temporaryProject() {
  const projectRoot = fs.mkdtempSync(join(os.tmpdir(), "check-new-duplicates-"))
  temporaryDirectories.push(projectRoot)
  return projectRoot
}

function successfulGit(command: string, args: string[]) {
  if (command !== "git") throw new Error(`Неожиданная команда: ${command}`)
  if (args[0] === "cat-file") return { status: 0, stdout: "" }
  if (args[0] === "diff") return { status: 0, stdout: "" }
  throw new Error(`Неожиданные аргументы git: ${args.join(" ")}`)
}

function reportWithOneClone() {
  return {
    duplicates: [{
      firstFile: { name: "a.ts", start: 10, end: 14 },
      secondFile: { name: "b.ts", start: 20, end: 24 },
    }],
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

describe("check new duplicates", () => {
  it.each([
    ["старый дубль", [], []],
    [
      "новый фрагмент против старого",
      [{ path: "a.ts", start: 10, end: 14 }],
      ["a.ts:10-14 <-> b.ts:20-24"],
    ],
    [
      "два новых фрагмента",
      [
        { path: "a.ts", start: 10, end: 14 },
        { path: "b.ts", start: 20, end: 24 },
      ],
      ["a.ts:10-14 <-> b.ts:20-24"],
    ],
    [
      "новый второй фрагмент против старого",
      [{ path: "b.ts", start: 20, end: 24 }],
      ["a.ts:10-14 <-> b.ts:20-24"],
    ],
    ["фрагменты из разных файлов", [{ path: "c.ts", start: 10, end: 14 }], []],
    ["соседние непересекающиеся строки", [{ path: "a.ts", start: 1, end: 9 }], []],
    ["следующие непересекающиеся строки", [{ path: "a.ts", start: 15, end: 20 }], []],
    ["пересечение по первой строке", [{ path: "a.ts", start: 1, end: 10 }], ["a.ts:10-14 <-> b.ts:20-24"]],
    ["пересечение по последней строке", [{ path: "a.ts", start: 14, end: 14 }], ["a.ts:10-14 <-> b.ts:20-24"]],
  ])("%s", (_name, added, expected) => {
    expect(findNewClones(reportWithOneClone(), added)).toEqual(expected)
  })

  it("выделяет добавленные строки из diff с --unified=0 и --find-renames", () => {
    expect(parseAddedLineRanges(`diff --git a/packages/rules/a.ts b/packages/rules/a.ts
index 1111111..2222222 100644
--- a/packages/rules/a.ts
+++ b/packages/rules/a.ts
@@ -1,0 +2,3 @@
+one
+two
+three
@@ -10 +14 @@
-old
+new
`)).toEqual([
      { path: "packages/rules/a.ts", start: 2, end: 4 },
      { path: "packages/rules/a.ts", start: 14, end: 14 },
    ])
  })

  it("не считает чистое переименование добавленными строками", () => {
    expect(parseAddedLineRanges(`diff --git a/packages/rules/a.ts b/packages/rules/b.ts
similarity index 100%
rename from packages/rules/a.ts
rename to packages/rules/b.ts
`)).toEqual([])
  })

  it("сохраняет все строки hunk с двузначным размером", () => {
    expect(parseAddedLineRanges(`diff --git a/packages/rules/a.ts b/packages/rules/a.ts
+++ b/packages/rules/a.ts
@@ -0,0 +20,10 @@
`)).toEqual([{ path: "packages/rules/a.ts", start: 20, end: 29 }])
  })

  it("игнорирует hunk без добавленных строк", () => {
    expect(parseAddedLineRanges(`diff --git a/packages/rules/a.ts b/packages/rules/a.ts
+++ b/packages/rules/a.ts
@@ -20,1 +20,0 @@
`)).toEqual([])
  })

  it("сопоставляет абсолютные пути jscpd с путями репозитория в POSIX-виде", () => {
    const projectRoot = "/repository"
    const report = {
      duplicates: [{
        firstFile: { name: "/repository/packages/rules/a.ts", start: 10, end: 14 },
        secondFile: { name: "/repository/packages/rules/b.ts", start: 20, end: 24 },
      }],
    }

    expect(findNewClones(report, [{ path: "packages/rules/a.ts", start: 10, end: 14 }], projectRoot)).toEqual([
      "packages/rules/a.ts:10-14 <-> packages/rules/b.ts:20-24",
    ])
  })

  it.each([
    { argv: [] },
    { argv: ["--base"] },
    { argv: ["--base", ""] },
    { argv: ["--other", "abc"] },
    { argv: ["--base", "abc", "extra"] },
  ])(
    "требует единственный аргумент --base: $argv",
    ({ argv }) => {
      expect(() => parseArguments(argv)).toThrow("Использование: pnpm check:duplicates -- --base <commit>")
    }
  )

  it("принимает обязательный базовый коммит", () => {
    expect(parseArguments(["--", "--base", "e768ba6"])).toEqual({ base: "e768ba6" })
    expect(parseArguments(["--base", "e768ba6"])).toEqual({ base: "e768ba6" })
  })

  it.each([
    [null, "Отчёт jscpd не содержит массив duplicates"],
    [{}, "Отчёт jscpd не содержит массив duplicates"],
    ["not json", "Отчёт jscpd не содержит массив duplicates"],
    [{ duplicates: [null] }, "Клон jscpd не содержит firstFile"],
    [{ duplicates: [{}] }, "Клон jscpd не содержит firstFile"],
    [{ duplicates: [{ firstFile: null, secondFile: { name: "b.ts", start: 1, end: 2 } }] }, "Клон jscpd не содержит firstFile"],
    [{ duplicates: [{ firstFile: { name: "a.ts", start: 1, end: 2 }, secondFile: {} }] }, "Клон jscpd не содержит корректный secondFile"],
    [{ duplicates: [{ firstFile: { name: "", start: 1, end: 2 }, secondFile: { name: "b.ts", start: 1, end: 2 } }] }, "Клон jscpd не содержит firstFile"],
    [{ duplicates: [{ firstFile: { name: 1, start: 1, end: 2 }, secondFile: { name: "b.ts", start: 1, end: 2 } }] }, "Клон jscpd не содержит firstFile"],
    [{ duplicates: [{ firstFile: { name: "a.ts", start: 0, end: 2 }, secondFile: { name: "b.ts", start: 1, end: 2 } }] }, "Клон jscpd не содержит firstFile"],
    [{ duplicates: [{ firstFile: { name: "a.ts", start: 1.5, end: 2 }, secondFile: { name: "b.ts", start: 1, end: 2 } }] }, "Клон jscpd не содержит firstFile"],
    [{ duplicates: [{ firstFile: { name: "a.ts", start: 2, end: 1 }, secondFile: { name: "b.ts", start: 1, end: 2 } }] }, "Клон jscpd не содержит firstFile"],
  ])("отклоняет повреждённый или неполный JSON: %j", (report, message) => {
    expect(() => parseJscpdReport(report)).toThrow(message)
  })

  it("останавливается, если базовый коммит не существует", () => {
    const projectRoot = temporaryProject()

    expect(() => runDuplicateCheck(projectRoot, { base: "missing" }, () => ({ status: 1 }))).toThrow(
      "Не найден базовый коммит: missing"
    )
  })

  it("возвращает ошибку jscpd", () => {
    const projectRoot = temporaryProject()

    expect(runDuplicateCheck(projectRoot, { base: "base" }, (command: string, args: string[]) => {
      if (command === "git") return successfulGit(command, args)
      return { status: 7 }
    })).toBe(7)
  })

  it.each(["{", JSON.stringify({ duplicates: [{}] })])(
    "отклоняет повреждённый отчёт jscpd: %s",
    (report) => {
      const projectRoot = temporaryProject()

      expect(() => runDuplicateCheck(projectRoot, { base: "base" }, (command: string, args: string[]) => {
        if (command === "git") return successfulGit(command, args)
        const reportDirectory = join(projectRoot, "reports/jscpd")
        fs.mkdirSync(reportDirectory, { recursive: true })
        fs.writeFileSync(join(reportDirectory, "jscpd-report.json"), report)
        return { status: 0 }
      })).toThrow()
    }
  )
})
