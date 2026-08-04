import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, it } from "vitest"
import { discoverProjectStateValidationFileBatches } from "./projectFiles"

it.each([1, 2])("выдаёт ленивые пути пачками по %s без общего массива", async (batchSize) => {
  const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-files-"))
  try {
    await mkdir(join(projectDir, "cf"), { recursive: true })
    await writeFile(join(projectDir, "cf", "Конфигурация.yaml"), "Имя: Тест\n")
    await mkdir(join(projectDir, "cf", "Справочник", "Товары"), { recursive: true })
    await writeFile(join(projectDir, "cf", "Справочник", "Товары", "Свойства.yaml"), "{}\n")
    await mkdir(join(projectDir, "cf", "Документ", "Заказ"), { recursive: true })
    await writeFile(join(projectDir, "cf", "Документ", "Заказ", "Свойства.yaml"), "{}\n")

    const batches = []
    for await (const batch of discoverProjectStateValidationFileBatches(projectDir, batchSize)) batches.push(batch)

    expect(batches.map(({ paths }) => paths.length)).toEqual(
      batchSize === 1 ? [1, 1, 1] : [2, 1],
    )
    const paths = batches.flatMap((batch) => batch.paths)
    expect(paths.map(({ projectPath }) => projectPath)).toEqual([
      "cf/Конфигурация.yaml",
      "cf/Документ/Заказ/Свойства.yaml",
      "cf/Справочник/Товары/Свойства.yaml",
    ])
    const first = paths[0]!.classify()
    expect(first?.identity.projectPath).toBe("cf/Конфигурация.yaml")
    expect(paths[0]!.classify()).toBe(first)
  } finally {
    await rm(projectDir, { recursive: true, force: true })
  }
})
