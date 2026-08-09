import fs from "node:fs"
import { afterEach, describe, expect, it } from "vitest"
import { finalizePartialXmlSyncPackage } from "./finalizePartialXmlSyncPackage"
import { preparePartialXmlSyncPackage } from "./preparePartialXmlSyncPackage"
import {
  createPartialSyncTestProject,
  FORM_PATH,
  MODULE_PATH,
} from "./__fixtures__/projectFactory"

type TestProject = Awaited<ReturnType<typeof createPartialSyncTestProject>>

describe("сквозная подготовка частичного XML-пакета", () => {
  const projects: TestProject[] = []
  afterEach(async () => {
    let project = projects.pop()
    while (project !== undefined) {
      await project.close()
      project = projects.pop()
    }
  })

  it("выгружает только изменённую форму и публикует снимок отдельной операцией", async () => {
    const project = await createProject()
    const publishedBefore = fs.readFileSync(project.indexPath)
    project.write(FORM_PATH, "Реквизиты: {}\nКомментарий: Изменена форма\n")

    const prepared = await preparePartialXmlSyncPackage({
      context: project.context,
      projectDir: project.projectDir,
      componentPath: "cf",
      projectState: project.projectState,
    })

    expect(prepared.ok).toBe(true)
    if (!prepared.ok || prepared.status !== "prepared") throw new Error("Пакет не подготовлен")
    expect(prepared.entries).toEqual([
      "Catalogs/Товары/Forms/ФормаЭлемента.xml",
      "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form.xml",
      "load.lst",
    ])
    expect(prepared.loadTargets).toEqual(["Catalogs/Товары/Forms/ФормаЭлемента.xml"])
    expect(fs.readFileSync(project.indexPath)).toEqual(publishedBefore)

    await finalizePartialXmlSyncPackage({
      projectDir: project.projectDir,
      componentPath: "cf",
      packageId: prepared.packageId,
    })

    expect(fs.readFileSync(project.indexPath)).not.toEqual(publishedBefore)
    expect(fs.existsSync(prepared.archivePath)).toBe(false)
  })

  it("пишет изменение модуля напрямую и не добавляет XML владельца", async () => {
    const project = await createProject()
    project.write(MODULE_PATH, "Процедура ПриОткрытии()\n// Изменено\nКонецПроцедуры\n")

    const prepared = await prepare(project)

    expect(prepared.entries).toEqual(["Catalogs/Товары/Ext/ObjectModule.bsl", "load.lst"])
    expect(prepared.loadTargets).toEqual(["Catalogs/Товары/Ext/ObjectModule.bsl"])
  })

  it("при добавлении и удалении формы включает владельца и текущее содержимое коллекции", async () => {
    const addedProject = await createProject()
    addedProject.write("Справочник/Товары/Формы/Дополнительная/Форма.yaml", "Реквизиты: {}\n")

    const added = await prepare(addedProject)

    expect(added.loadTargets).toEqual([
      "Catalogs/Товары.xml",
      "Catalogs/Товары/Forms/Дополнительная.xml",
    ])
    expect(added.entries).toEqual(expect.arrayContaining([
      "Catalogs/Товары.xml",
      "Catalogs/Товары/Forms/Дополнительная.xml",
      "Catalogs/Товары/Forms/Дополнительная/Ext/Form.xml",
      "Catalogs/Товары/Forms/ФормаЭлемента.xml",
      "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form.xml",
    ]))

    const deletedProject = await createProject()
    deletedProject.remove(FORM_PATH)

    const deleted = await prepare(deletedProject)

    expect(deleted.loadTargets).toEqual(["Catalogs/Товары.xml"])
    expect(deleted.entries).toEqual(expect.arrayContaining([
      "Catalogs/Товары.xml",
      "load.lst",
    ]))
  })

  it("при добавлении и удалении справочника включает корень конфигурации", async () => {
    const addedProject = await createProject()
    addedProject.write("Справочник/Новый/Свойства.yaml", "Комментарий: Новый\n")

    const added = await prepare(addedProject)

    expect(added.loadTargets).toContain("Configuration.xml")
    expect(added.loadTargets).toContain("Catalogs/Новый.xml")

    const deletedProject = await createProject()
    deletedProject.remove("Справочник/Товары/Свойства.yaml")
    deletedProject.remove(FORM_PATH)
    deletedProject.remove(MODULE_PATH)

    const deleted = await prepare(deletedProject)

    expect(deleted.loadTargets).toContain("Configuration.xml")
    expect(deleted.entries).toContain("Configuration.xml")
  })

  it("повторяет подготовку с опубликованной базы и удаляет предыдущий пакет", async () => {
    const project = await createProject()
    const publishedBefore = fs.readFileSync(project.indexPath)
    project.write(FORM_PATH, "Реквизиты: {}\nКомментарий: Повтор\n")

    const first = await prepare(project)
    const second = await prepare(project)

    expect(second.packageId).not.toBe(first.packageId)
    expect(fs.existsSync(first.archivePath)).toBe(false)
    expect(fs.existsSync(second.archivePath)).toBe(true)
    expect(fs.readFileSync(project.indexPath)).toEqual(publishedBefore)
  })

  it("не создаёт ZIP, когда текущие хэши совпадают с опубликованным снимком", async () => {
    const project = await createProject()

    const result = await preparePartialXmlSyncPackage({
      context: project.context,
      projectDir: project.projectDir,
      componentPath: "cf",
      projectState: project.projectState,
    })

    expect(result).toEqual({ ok: true, status: "unchanged", diagnostics: [] })
  })

  async function createProject(): Promise<TestProject> {
    const project = await createPartialSyncTestProject()
    projects.push(project)
    return project
  }

  async function prepare(project: TestProject) {
    const result = await preparePartialXmlSyncPackage({
      context: project.context,
      projectDir: project.projectDir,
      componentPath: "cf",
      projectState: project.projectState,
    })
    if (!result.ok || result.status !== "prepared") {
      throw new Error(`Пакет не подготовлен: ${result.diagnostics.map(({ message }) => message).join("; ")}`)
    }
    return result
  }
})
