import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { readComponentHashState } from "../project/componentState/hashes"
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

    const prepared = await source.read({
      extensionAssignment: assignment(state.projectPath, "/extension/Форма.yaml"),
      baseProjectPath: state.projectPath,
    })

    expect(prepared.projectPath).toBe(state.projectPath)
    expect(prepared.data).toMatchObject({ Заголовок: "Основная форма" })
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

  async function createBase() {
    const projectDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-base-form-source-"))
    tempDirs.push(projectDir)
    const projectPath =
      "Справочник/СправочникПолный/Формы/ФормаЭлемента/Форма.yaml"
    const sourcePath = join(projectDir, "cf", ...projectPath.split("/"))
    fs.mkdirSync(join(sourcePath, ".."), { recursive: true })
    fs.writeFileSync(sourcePath, "Заголовок: Основная форма\n")
    const structure = await readComponentProjectStructure({
      projectDir,
      address: { kind: "configuration" },
    })
    const hashes = await readComponentHashState({ structure })
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
