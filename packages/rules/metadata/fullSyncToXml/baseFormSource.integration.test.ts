import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import "../../tests/metadataExecutionContext"
import { hashConfigurationProjectFileList } from "../configurationIndex"
import { readComponentProjectStructure } from "../project/componentState/structure"
import { fullXmlSyncTestTopologyFields } from "./testTopology"
import type { FullXmlSyncAssignment } from "./types"
import {
  BaseFormSourceError,
  createVerifiedBaseFormSource,
} from "./baseFormSource"

describe("verified base form source", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it("reads and parses exactly the requested confirmed base form", async () => {
    const state = await createBase()
    const source = createVerifiedBaseFormSource({
      baseStructure: state.structure,
      baseHashes: state.hashes,
    })

    const result = await source.read({
      extensionAssignment: assignment(state.projectPath, "/extension/Форма.yaml"),
      baseProjectPath: state.projectPath,
    })

    expect(result.kind).toBe("projected")
    expect(result.baseForm.projectPath).toBe(state.projectPath)
    expect(result.baseForm.prepared.data).toMatchObject({ Заголовок: "Основная форма" })
    expect(result.currentConfigurationForm).toBe(result.baseForm)
  })

  it("rejects a base YAML changed after hashes were received", async () => {
    const state = await createBase()
    const source = createVerifiedBaseFormSource({
      baseStructure: state.structure,
      baseHashes: state.hashes,
    })
    fs.writeFileSync(state.sourcePath, "Заголовок: Изменено\n")

    await expect(source.read({
      extensionAssignment: assignment(state.projectPath, "/extension/Форма.yaml"),
      baseProjectPath: state.projectPath,
    })).rejects.toMatchObject({
      code: "full_xml_sync_base_form_changed",
    } satisfies Partial<BaseFormSourceError>)
  })

  it("читает подтверждённый YAML-владелец встроенной общей формы", async () => {
    const state = await createBase(
      "ОбщаяФорма/ФормаПродаж/Свойства.yaml",
      [
        "Имя: ФормаПродаж",
        "Форма:",
        "  Заголовок: Основная форма",
        "",
      ].join("\n")
    )
    const source = createVerifiedBaseFormSource({
      baseStructure: state.structure,
      baseHashes: state.hashes,
    })

    const result = await source.read({
      extensionAssignment: assignment(
        state.projectPath,
        "/extension/Свойства.yaml"
      ),
      baseProjectPath: state.projectPath,
    })

    expect(result.kind).toBe("projected")
    expect(result.baseForm.prepared.role).toBe("properties")
    expect(result.baseForm.prepared.data).toMatchObject({
      Форма: { Заголовок: "Основная форма" },
    })
  })

  it("prefers a confirmed saved base form companion", async () => {
    const base = await createBase()
    const saved = await createBase(
      "Справочник/СправочникПолный/Формы/ФормаЭлемента/БазоваяФорма.yaml",
      "Заголовок: Сохранённая основа\n"
    )
    const source = createVerifiedBaseFormSource({
      baseStructure: base.structure,
      baseHashes: base.hashes,
      savedStructure: saved.structure,
      savedHashes: saved.hashes,
    })

    const result = await source.read({
      extensionAssignment: assignment(base.projectPath, "/extension/Форма.yaml"),
      baseProjectPath: base.projectPath,
      savedProjectPath: saved.projectPath,
    })

    expect(result.kind).toBe("saved")
    expect(result.baseForm.projectPath).toBe(saved.projectPath)
    expect(result.baseForm.prepared.data).toMatchObject({ Заголовок: "Сохранённая основа" })
    expect(result.currentConfigurationForm.projectPath).toBe(base.projectPath)
    expect(result.currentConfigurationForm.prepared.data).toMatchObject({ Заголовок: "Основная форма" })
  })

  it("reads the changed current form after confirmation without creating a companion", async () => {
    const state = await createBase()
    const companionPath = join(state.sourcePath, "..", "БазоваяФорма.yaml")
    const first = await createVerifiedBaseFormSource({
      baseStructure: state.structure,
      baseHashes: state.hashes,
    }).read({
      extensionAssignment: assignment(state.projectPath, "/extension/Форма.yaml"),
      baseProjectPath: state.projectPath,
    })
    fs.writeFileSync(state.sourcePath, "Заголовок: Обновлённая форма\n")
    const refreshedHashes = {
      componentPath: state.structure.componentPath,
      projectFiles: await hashConfigurationProjectFileList(
        state.structure.componentDir,
        state.structure.projectPaths,
      ),
    }
    const second = await createVerifiedBaseFormSource({
      baseStructure: state.structure,
      baseHashes: refreshedHashes,
    }).read({
      extensionAssignment: assignment(state.projectPath, "/extension/Форма.yaml"),
      baseProjectPath: state.projectPath,
    })

    expect(first.baseForm.prepared.data).toMatchObject({ Заголовок: "Основная форма" })
    expect(second.baseForm.prepared.data).toMatchObject({ Заголовок: "Обновлённая форма" })
    expect(fs.existsSync(companionPath)).toBe(false)
  })

  async function createBase(
    projectPath =
      "Справочник/СправочникПолный/Формы/ФормаЭлемента/Форма.yaml",
    content = "Заголовок: Основная форма\n"
  ) {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-base-form-source-"))
    tempDirs.push(projectDir)
    const sourcePath = join(projectDir, "cf", ...projectPath.split("/"))
    fs.mkdirSync(join(sourcePath, ".."), { recursive: true })
    fs.writeFileSync(sourcePath, content)
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const hashes = {
      componentPath: structure.componentPath,
      projectFiles: await hashConfigurationProjectFileList(structure.componentDir, structure.projectPaths),
    }
    return { structure, hashes, projectPath, sourcePath }
  }
})

function assignment(
  sourceProjectPath: string,
  sourcePath: string
): FullXmlSyncAssignment {
  return {
    id: sourceProjectPath,
    sourceProjectPath,
    sourcePath,
    expectedContentHash: 0n,
    role: "form",
    itemType: "ClientApplicationForm",
    itemName: "ФормаЭлемента",
    logicalAddress:
      "Справочник.СправочникПолный.Форма.ФормаЭлемента",
    ...fullXmlSyncTestTopologyFields(sourceProjectPath),
  }
}
