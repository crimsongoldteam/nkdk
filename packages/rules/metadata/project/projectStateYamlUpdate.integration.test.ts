import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import "../../tests/metadataExecutionContext"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { createProjectYamlCache } from "../validation/projectYamlCache"
import { validateProjectFileFirstPass } from "../validation/projectValidationPasses"
import { createTestValidationSchemaCache } from "../validation/tests/testValidationSchemaCache"
import {
  createTestValidationRulesSnapshot,
  removeTrackedDirectories,
} from "../validation/tests/validationTestSupport"
import { buildProjectStateYamlFileUpdate, buildProjectStateYamlFileUpdateFromFacts } from "./projectStateYamlUpdate"

describe("buildProjectStateYamlFileUpdate", () => {
  const tempDirs: string[] = []
  const schemaCache = createTestValidationSchemaCache()
  let rulesSnapshot: ReturnType<typeof createTestValidationRulesSnapshot>

  beforeAll(() => {
    rulesSnapshot = createTestValidationRulesSnapshot()
  })

  afterEach(() => {
    removeTrackedDirectories(tempDirs)
  })

  it.each([
    { componentPath: "cf", fileName: "Форма.yaml", representation: "working", isolated: false },
    { componentPath: "cf", fileName: "БазоваяФорма.yaml", representation: "base", isolated: true },
    { componentPath: "cfe/Расширение", fileName: "Форма.yaml", representation: "working", isolated: false },
    { componentPath: "cfe/Расширение", fileName: "БазоваяФорма.yaml", representation: "base", isolated: true },
  ] as const)("сохраняет всё состояние $componentPath/$fileName при сборке из фактов", (scenario) => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-state-yaml-update-"))
    tempDirs.push(projectDir)
    const componentDir = join(projectDir, scenario.componentPath)
    const projectPath = `Справочник/Товары/Формы/ФормаЭлемента/${scenario.fileName}`
    const workingProjectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const filePath = join(componentDir, ...projectPath.split("/"))
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(
      filePath,
      "Реквизиты:\n  Объект:\n    Тип: Строка\nЭлементы:\n  Поле:\n    Вид: ПолеВвода\n    ПутьКДанным: Объект\n  НеверноеПоле:\n    Вид: ПолеВвода\n    ПутьКДанным: !xml/invalid Таблица[4].Реквизит\n",
    )
    const file = resolveValidationProjectFile(componentDir, filePath)
    if (file === undefined) throw new Error("Не удалось классифицировать форму")
    const firstPass = validateProjectFileFirstPass({
      projectDir: componentDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache,
      rulesSnapshot,
    })

    const input = {
      projectDir,
      descriptor: {
        componentPath: scenario.componentPath,
        componentDir,
        rootProjectPath: `${scenario.componentPath}/${projectPath}`,
        projectPath,
        role: "form" as const,
        ...(scenario.isolated ? { indexContribution: "isolated" as const } : {}),
      },
      firstPass,
      fileBackedTargets: [],
    }
    const update = buildProjectStateYamlFileUpdate(input)
    const { state, ...facts } = firstPass
    if (state.kind === "failed") throw new Error("Не собраны факты формы")
    expect(buildProjectStateYamlFileUpdateFromFacts({
      projectDir, descriptor: input.descriptor,
      facts: { ...facts, pendingChecks: state.pendingChecks }, fileBackedTargets: [],
    })).toEqual(update)

    expect(update.structuredDocuments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        documentKind: "clientApplicationForm",
        representation: scenario.representation,
        logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
        workingProjectPath,
      }),
      expect.objectContaining({ componentKind: "attribute", name: "Объект" }),
      expect.objectContaining({ componentKind: "element", name: "Поле" }),
    ]))
    expect(update.structuredDocuments?.filter(({ componentKind }) => componentKind === "dataPath"))
      .toEqual([expect.objectContaining({
        name: "Объект",
        yamlPath: ["Элементы", "Поле", "ПутьКДанным"],
        payload: JSON.stringify({
          version: 1,
          mode: "explicit",
          owner: { kind: "Справочник", name: "Товары" },
        }),
      })])
    const document = update.structuredDocuments?.find(({ componentKind }) => componentKind === "document")
    expect(JSON.parse(document?.payload ?? "null")).toMatchObject({
      version: 1,
      yaml: { Элементы: { Поле: { Вид: "ПолеВвода" } } },
    })
  })
})
