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

it("проецирует цели формы и всех файлов макета для конфигурации и расширения", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-file-targets-"))
  try {
    for (const componentPath of ["cf", "cfe/Цены"]) {
      const ownerDir = join(projectDir, componentPath, "Документ", "Заказ")
      await mkdir(join(ownerDir, "Формы", "Основная"), { recursive: true })
      await writeFile(join(ownerDir, "Формы", "Основная", "Форма.yaml"), "{}\n")
      await writeFile(join(ownerDir, "Формы", "Основная", "Модуль.bsl"), "")
      await mkdir(join(ownerDir, "Шаблоны", "Печать", "Ext"), { recursive: true })
      for (const relativePath of ["Template.xml", "Template.txt", "Template.bin", "Ext/Картинка.png"]) {
        await writeFile(join(ownerDir, "Шаблоны", "Печать", relativePath), "")
      }
    }

    const files = []
    for await (const batch of discoverProjectStateValidationFileBatches(projectDir, 256)) {
      files.push(...batch.paths.map((path) => path.classify()).filter((file) => file !== undefined))
    }

    for (const componentPath of ["cf", "cfe/Цены"]) {
      const prefix = `${componentPath}/Документ/Заказ`
      const form = files.find(({ identity }) => identity.projectPath === `${prefix}/Формы/Основная/Форма.yaml`)
      expect(form?.targets).toEqual([{
        kind: "member",
        canonical: "Document.Заказ.Form.Основная",
        fileBacked: {
          itemProjectPath: `${prefix}/Формы/Основная`,
          ownerProjectPath: `${prefix}/Свойства.yaml`,
        },
      }])
      expect(files.find(({ identity }) => identity.projectPath === `${prefix}/Формы/Основная/Модуль.bsl`)?.targets)
        .toEqual([])

      for (const relativePath of ["Template.xml", "Template.txt", "Template.bin", "Ext/Картинка.png"]) {
        expect(files.find(({ identity }) =>
          identity.projectPath === `${prefix}/Шаблоны/Печать/${relativePath}`)?.targets).toEqual([{
          kind: "member",
          canonical: "Document.Заказ.Template.Печать",
          fileBacked: {
            itemProjectPath: `${prefix}/Шаблоны/Печать`,
            ownerProjectPath: `${prefix}/Свойства.yaml`,
          },
        }])
      }
    }
  } finally {
    await rm(projectDir, { recursive: true, force: true })
  }
})
