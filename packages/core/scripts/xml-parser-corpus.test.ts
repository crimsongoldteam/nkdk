import fs from "node:fs"
import os from "node:os"
import { join, resolve } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
// @ts-expect-error CLI-модуль остаётся JavaScript без декларации типов.
import * as corpusHelpers from "./xml-parser-corpus.mjs"

const { collectXmlCorpus, comparableXml, firstDifferencePath, parseXmlParserArguments } = corpusHelpers

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})

describe("XML parser corpus", () => {
  it("разбирает параметры и сохраняет три прогона", () => {
    expect(parseXmlParserArguments(["--", "--xml-dir", "/xml", "--large", "/large.xml"])).toEqual({
      xmlDir: "/xml",
      largePaths: ["/large.xml"],
      sampleSize: 5000,
      runs: 3,
    })
    expect(() => parseXmlParserArguments(["--sample-size", "0"])).toThrow("положительным")
  })

  it("детерминированно выбирает малые XML и дедуплицирует общий корпус", async () => {
    const root = fs.mkdtempSync(join(os.tmpdir(), "nkdk-xml-corpus-"))
    temporaryDirectories.push(root)
    const coreDir = join(root, "core")
    const xmlDir = join(root, "xml")
    const fixturePaths = [
      join(coreDir, "feature", "__fixtures__", "first.xml"),
      join(coreDir, "feature", "fixtures", "second.xml"),
    ]
    const externalPaths = Array.from({ length: 6 }, (_, index) => join(xmlDir, `0${index + 1}.xml`))
    for (const path of [...fixturePaths, ...externalPaths]) {
      fs.mkdirSync(join(path, ".."), { recursive: true })
      fs.writeFileSync(path, "<Root/>")
    }

    const corpus = await collectXmlCorpus(coreDir, {
      xmlDir,
      largePaths: [fixturePaths[0]!],
      sampleSize: 3,
      runs: 3,
    })

    expect(corpus.fixturePaths).toEqual(fixturePaths.map((path) => resolve(path)))
    expect(corpus.smallPaths).toEqual(
      [externalPaths[0], externalPaths[2], externalPaths[4]].map((path) => resolve(path!))
    )
    expect(corpus.largePaths).toEqual([resolve(fixturePaths[0]!)])
    expect(corpus.allPaths).toHaveLength(5)
    expect(new Set(corpus.allPaths).size).toBe(corpus.allPaths.length)
  })

  it("включает childOrder в сравнимое представление", () => {
    const left = { Root: {} }
    const right = { Root: {} }
    Object.defineProperty(left.Root, Symbol.for("metadata"), {
      value: { childOrder: [{ key: "A", index: 0 }] },
    })
    Object.defineProperty(right.Root, Symbol.for("metadata"), {
      value: { childOrder: [{ key: "B", index: 0 }] },
    })

    const comparableLeft = comparableXml(left)
    const comparableRight = comparableXml(right)
    expect(comparableLeft).not.toEqual(comparableRight)
    expect(firstDifferencePath(comparableLeft, comparableRight)).toBe("$.Root.@@childOrder[0].key")
  })

  it("показывает индекс первого расхождения массива", () => {
    expect(firstDifferencePath({ Root: { A: [1, 2] } }, { Root: { A: [1, 3] } })).toBe("$.Root.A[1]")
  })
})
