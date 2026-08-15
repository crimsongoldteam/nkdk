import { describe, expect, it } from "vitest"
import { detectPartialXmlChanges, supplementCurrentVersions } from "./changeDetector"
import type { PartialXmlFileVersion } from "./types"

const version = (projectPath: string, contentHash: bigint): PartialXmlFileVersion => ({
  projectPath,
  contentHash,
})

describe("detectPartialXmlChanges", () => {
  it("добавляет в текущий набор существующие пути предыдущего снимка", async () => {
    const read = async (projectPath: string) =>
      projectPath === "Форма.query" ? version(projectPath, 7n) : undefined

    await expect(supplementCurrentVersions({
      current: [version("Свойства.yaml", 1n)],
      previous: [version("Свойства.yaml", 1n), version("Форма.query", 7n), version("Удалён.bin", 2n)],
      read,
    })).resolves.toEqual([
      version("Свойства.yaml", 1n),
      version("Форма.query", 7n),
    ])
  })

  it.each([
    {
      name: "неизменившийся файл",
      current: [version("Конфигурация.yaml", 1n)],
      previous: [version("Конфигурация.yaml", 1n)],
      expected: { added: [], changed: [], deleted: [] },
    },
    {
      name: "добавленный файл",
      current: [version("Модуль.bsl", 2n)],
      previous: [],
      expected: { added: [version("Модуль.bsl", 2n)], changed: [], deleted: [] },
    },
    {
      name: "изменённый файл",
      current: [version("Модуль.bsl", 2n)],
      previous: [version("Модуль.bsl", 1n)],
      expected: {
        added: [],
        changed: [{ current: version("Модуль.bsl", 2n), previous: version("Модуль.bsl", 1n) }],
        deleted: [],
      },
    },
    {
      name: "удалённый файл",
      current: [],
      previous: [version("Модуль.bsl", 1n)],
      expected: { added: [], changed: [], deleted: [version("Модуль.bsl", 1n)] },
    },
    {
      name: "несортированный смешанный ввод",
      current: [
        version("Формы/Я/Форма.yaml", 4n),
        version("Формы/А/Форма.yaml", 3n),
        version("Свойства.yaml", 8n),
      ],
      previous: [
        version("Формы/Б/Форма.yaml", 2n),
        version("Свойства.yaml", 7n),
      ],
      expected: {
        added: [version("Формы/А/Форма.yaml", 3n), version("Формы/Я/Форма.yaml", 4n)],
        changed: [{ current: version("Свойства.yaml", 8n), previous: version("Свойства.yaml", 7n) }],
        deleted: [version("Формы/Б/Форма.yaml", 2n)],
      },
    },
  ])("определяет $name", ({ current, previous, expected }) => {
    expect(detectPartialXmlChanges({ current, previous })).toEqual(expected)
  })

  it.each([
    ["текущем", [version("a.yaml", 1n), version("a.yaml", 2n)], []],
    ["предыдущем", [], [version("a.yaml", 1n), version("a.yaml", 2n)]],
  ])("отвергает повтор пути в %s наборе", (_name, current, previous) => {
    expect(() => detectPartialXmlChanges({ current, previous })).toThrow("повторяется")
  })

  it.each(["", "/a.yaml", "a\\b.yaml", "a//b.yaml", "a/./b.yaml", "a/../b.yaml"])(
    "отвергает ненормализованный путь %j",
    (projectPath) => {
      expect(() => detectPartialXmlChanges({ current: [version(projectPath, 1n)], previous: [] }))
        .toThrow("нормализованным")
    },
  )
})
