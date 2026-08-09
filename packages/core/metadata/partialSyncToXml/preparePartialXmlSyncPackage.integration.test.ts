import fs from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { ProjectStateService } from "../projectState"
import { finalizePartialXmlSyncPackage } from "./finalizePartialXmlSyncPackage"
import {
  preparePartialXmlSyncPackage,
  type PreparePartialXmlSyncPackageResult,
} from "./preparePartialXmlSyncPackage"
import {
  createPartialSyncTestProject,
  createPartialSyncTestProjectState,
  FORM_PATH,
  MODULE_PATH,
  preparePartialSyncTestPackage,
  type PartialSyncTestProject,
  type PreparedPartialSyncTestPackage,
} from "./__fixtures__/projectFactory"

describe("сквозная подготовка частичного XML-пакета", () => {
  const projects: PartialSyncTestProject[] = []
  let projectState: ProjectStateService
  let form: { prepared: PreparedPartialSyncTestPackage; publishedChanged: boolean; archiveRemoved: boolean }
  let modulePrepared: PreparedPartialSyncTestPackage
  let retry: { first: PreparedPartialSyncTestPackage; second: PreparedPartialSyncTestPackage; publishedUnchanged: boolean }
  let unchanged: PreparePartialXmlSyncPackageResult

  beforeAll(async () => {
    projectState = createPartialSyncTestProjectState()
    const formProject = await createProject()
    const publishedBefore = fs.readFileSync(formProject.indexPath)
    formProject.write(FORM_PATH, "Реквизиты: {}\nКомментарий: Изменена форма\n")
    const preparedForm = await preparePartialSyncTestPackage(formProject)
    await finalizePartialXmlSyncPackage({
      projectDir: formProject.projectDir,
      componentPath: "cf",
      packageId: preparedForm.packageId,
    })
    form = {
      prepared: preparedForm,
      publishedChanged: !fs.readFileSync(formProject.indexPath).equals(publishedBefore),
      archiveRemoved: !fs.existsSync(preparedForm.archivePath),
    }

    const moduleProject = await createProject()
    moduleProject.write(MODULE_PATH, "Процедура ПриОткрытии()\n// Изменено\nКонецПроцедуры\n")
    modulePrepared = await preparePartialSyncTestPackage(moduleProject)

    const retryProject = await createProject()
    const retryPublished = fs.readFileSync(retryProject.indexPath)
    retryProject.write(FORM_PATH, "Реквизиты: {}\nКомментарий: Повтор\n")
    const first = await preparePartialSyncTestPackage(retryProject)
    const second = await preparePartialSyncTestPackage(retryProject)
    retry = {
      first,
      second,
      publishedUnchanged: fs.readFileSync(retryProject.indexPath).equals(retryPublished),
    }

    const unchangedProject = await createProject()
    unchanged = await preparePartialXmlSyncPackage({
      context: unchangedProject.context,
      projectDir: unchangedProject.projectDir,
      componentPath: "cf",
      projectState,
    })
  })

  afterAll(async () => {
    for (const project of projects) await project.close()
    await projectState.close()
  })

  it("выгружает только изменённую форму и публикует снимок отдельной операцией", () => {
    expect(form.prepared.entries).toEqual([
      "Catalogs/Товары/Forms/ФормаЭлемента.xml",
      "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form.xml",
      "load.lst",
    ])
    expect(form.prepared.loadTargets).toEqual(["Catalogs/Товары/Forms/ФормаЭлемента.xml"])
    expect(form.publishedChanged).toBe(true)
    expect(form.archiveRemoved).toBe(true)
  })

  it("пишет изменение модуля напрямую и не добавляет XML владельца", () => {
    expect(modulePrepared.entries).toEqual(["Catalogs/Товары/Ext/ObjectModule.bsl", "load.lst"])
    expect(modulePrepared.loadTargets).toEqual(["Catalogs/Товары/Ext/ObjectModule.bsl"])
  })

  it("повторяет подготовку с опубликованной базы и удаляет предыдущий пакет", () => {
    expect(retry.second.packageId).not.toBe(retry.first.packageId)
    expect(fs.existsSync(retry.first.archivePath)).toBe(false)
    expect(fs.existsSync(retry.second.archivePath)).toBe(true)
    expect(retry.publishedUnchanged).toBe(true)
  })

  it("не создаёт ZIP, когда текущие хэши совпадают с опубликованным снимком", () => {
    expect(unchanged).toEqual({ ok: true, status: "unchanged", diagnostics: [] })
  })

  async function createProject(): Promise<PartialSyncTestProject> {
    const project = await createPartialSyncTestProject(projectState)
    projects.push(project)
    return project
  }

})
