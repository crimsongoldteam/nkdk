import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { ProjectStateService } from "../projectState"
import {
  createPartialSyncTestProject,
  createPartialSyncTestProjectState,
  FORM_PATH,
  MODULE_PATH,
  preparePartialSyncTestPackage,
  type PartialSyncTestProject,
  type PreparedPartialSyncTestPackage,
} from "./__fixtures__/projectFactory"

describe("сквозная матрица структурных изменений частичного XML-пакета", () => {
  const projects: PartialSyncTestProject[] = []
  let projectState: ProjectStateService
  let addedForm: PreparedPartialSyncTestPackage
  let deletedForm: PreparedPartialSyncTestPackage
  let addedCatalog: PreparedPartialSyncTestPackage
  let deletedCatalog: PreparedPartialSyncTestPackage

  beforeAll(async () => {
    projectState = createPartialSyncTestProjectState()
    const addedFormProject = await createProject()
    addedFormProject.write("Справочник/Товары/Формы/Дополнительная/Форма.yaml", "Реквизиты: {}\n")
    addedForm = await preparePartialSyncTestPackage(addedFormProject)

    const deletedFormProject = await createProject()
    deletedFormProject.remove(FORM_PATH)
    deletedForm = await preparePartialSyncTestPackage(deletedFormProject)

    const addedCatalogProject = await createProject()
    addedCatalogProject.write("Справочник/Новый/Свойства.yaml", "Комментарий: Новый\n")
    addedCatalog = await preparePartialSyncTestPackage(addedCatalogProject)

    const deletedCatalogProject = await createProject()
    deletedCatalogProject.remove("Справочник/Товары/Свойства.yaml")
    deletedCatalogProject.remove(FORM_PATH)
    deletedCatalogProject.remove(MODULE_PATH)
    deletedCatalog = await preparePartialSyncTestPackage(deletedCatalogProject)
  })

  afterAll(async () => {
    for (const project of projects) await project.close()
    await projectState.close()
  })

  it("при добавлении формы включает владельца и текущее содержимое коллекции", () => {
    expect(addedForm.loadTargets).toEqual([
      "Catalogs/Товары.xml",
      "Catalogs/Товары/Forms/Дополнительная.xml",
    ])
    expect(addedForm.entries).toEqual(expect.arrayContaining([
      "Catalogs/Товары.xml",
      "Catalogs/Товары/Forms/Дополнительная.xml",
      "Catalogs/Товары/Forms/Дополнительная/Ext/Form.xml",
      "Catalogs/Товары/Forms/ФормаЭлемента.xml",
      "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form.xml",
    ]))
  })

  it("при удалении формы загружает владельца без удалённого XML", () => {
    expect(deletedForm.loadTargets).toEqual(["Catalogs/Товары.xml"])
    expect(deletedForm.entries).toEqual(expect.arrayContaining(["Catalogs/Товары.xml", "load.lst"]))
  })

  it("при добавлении справочника включает новый объект и корень конфигурации", () => {
    expect(addedCatalog.loadTargets).toContain("Configuration.xml")
    expect(addedCatalog.loadTargets).toContain("Catalogs/Новый.xml")
  })

  it("при удалении справочника поглощает дочерние удаления корнем конфигурации", () => {
    expect(deletedCatalog.loadTargets).toContain("Configuration.xml")
    expect(deletedCatalog.entries).toContain("Configuration.xml")
  })

  async function createProject(): Promise<PartialSyncTestProject> {
    const project = await createPartialSyncTestProject(projectState)
    projects.push(project)
    return project
  }

})
