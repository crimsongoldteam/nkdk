import fs from "node:fs"
import os from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "../configurationIndex/encode"
import { hashFileBytes } from "../configurationIndex/hash"
import { snapshotConfigurationIndex } from "../configurationIndex/sharedSnapshot"
import type { ConfigurationSnapshot, ConfigurationSnapshotEntity } from "../configurationIndex/types"
import { compileRegisteredMetadataResourceTopology } from "../resourceTopology/adapters/registeredRules"
import { classifyMetadataProjectPath } from "../resourceTopology/core/projectProjection"
import type { ConfirmedComponentState } from "../project/componentState/types"
import { createTestProjectStateReadToken } from "../projectState/tests/readToken"
import { configurationExtensionFullXmlSyncProfile } from "../fullSyncToXml/profiles/configurationExtension"
import { validateBorrowedExtensionForms } from "./borrowedFormValidation"

describe("обязательная валидация заимствованных форм расширения", () => {
  const tempDirs: string[] = []
  afterEach(() => {
    let dir = tempDirs.pop()
    while (dir !== undefined) {
      fs.rmSync(dir, { recursive: true, force: true })
      dir = tempDirs.pop()
    }
  })

  it("проверяет все заимствованные формы по cfe и cf, не используя соседнее расширение", async () => {
    const projectDir = project()
    const base = state(projectDir, "cf", formYaml(true), true)
    const target = state(projectDir, "cfe/Продажи", formYaml(false), false)
    const siblingPath = join(projectDir, "cfe", "Соседнее", ...FORM_PATH.split("/"))
    fs.mkdirSync(join(siblingPath, ".."), { recursive: true })
    fs.writeFileSync(siblingPath, formYaml(true))
    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })

    const diagnostics = await validateBorrowedExtensionForms({ runtime })

    expect(runtime.borrowedForms).toEqual([{
      logicalAddress: FORM_ADDRESS,
      extensionProjectPath: FORM_PATH,
      baseProjectPath: FORM_PATH,
    }])
    expect(diagnostics).toEqual([expect.objectContaining({
      filePath: join(projectDir, "cfe", "Продажи", ...FORM_PATH.split("/")),
      path: "Элементы.Группа.Элементы.НовыйКод",
      message: expect.stringContaining("НовыйКод"),
    })])
  })

  it("останавливает проверку формы, изменённой после подтверждённого хэша", async () => {
    const projectDir = project()
    const base = state(projectDir, "cf", formYaml(false), true)
    const target = state(projectDir, "cfe/Продажи", formYaml(false), false)
    const runtime = configurationExtensionFullXmlSyncProfile.confirm({ target, base })
    fs.appendFileSync(join(projectDir, "cfe", "Продажи", ...FORM_PATH.split("/")), "\nКомментарий: изменён\n")

    const diagnostics = await validateBorrowedExtensionForms({ runtime })

    expect(diagnostics).toEqual([expect.objectContaining({ message: expect.stringContaining("после получения хэшей") })])
  })

  function project(): string {
    const dir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-borrowed-form-"))
    tempDirs.push(dir)
    return dir
  }
})

const FORM_PATH = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
const FORM_ADDRESS = "Catalog.Товары.Form.ФормаЭлемента"

function state(
  projectDir: string,
  componentPath: string,
  yaml: string,
  withBaseUuid: boolean,
): ConfirmedComponentState {
  const componentDir = join(projectDir, ...componentPath.split("/"))
  const sourcePath = join(componentDir, ...FORM_PATH.split("/"))
  fs.mkdirSync(join(sourcePath, ".."), { recursive: true })
  fs.writeFileSync(sourcePath, yaml)
  const projectFiles = [{ projectPath: FORM_PATH, contentHash: hashFileBytes(fs.readFileSync(sourcePath)) }]
  const entities: ConfigurationSnapshotEntity[] = withBaseUuid
    ? [{
        logicalAddress: FORM_ADDRESS,
        sourceProjectPath: FORM_PATH,
        identities: { uuid: "11111111-1111-4111-8111-111111111111" },
      }]
    : []
  const snapshot: ConfigurationSnapshot = {
    specificationVersion: "1.3",
    indexGeneration: 1n,
    componentPath,
    files: projectFiles,
    entities,
  }
  const topology = compileRegisteredMetadataResourceTopology()
  const resource = classifyMetadataProjectPath(topology, FORM_PATH)
  if (resource === undefined) throw new Error("Тестовая форма не классифицирована")
  return {
    structure: {
      address: componentPath === "cf"
        ? { kind: "configuration" }
        : { kind: "configurationExtension", name: "Продажи" },
      componentPath,
      componentDir,
      topology,
      resources: [resource],
      projectPaths: [FORM_PATH],
    },
    hashes: { componentPath, projectFiles },
    indexes: {
      componentPath,
      sourceProjectFiles: projectFiles,
      logicalAddresses: [{ logicalAddress: FORM_ADDRESS, sourceProjectPath: FORM_PATH }],
    },
    snapshot: snapshotConfigurationIndex(encodeConfigurationIndex(snapshot)),
    projectStateReadToken: createTestProjectStateReadToken(),
  }
}

function formYaml(withNewCode: boolean): string {
  return [
    "Элементы:",
    "  Группа:",
    "    Вид: ГруппаФормы",
    ...(withNewCode
      ? ["    Элементы:", "      НовыйКод:", "        Вид: ПолеФормы"]
      : []),
  ].join("\n")
}
