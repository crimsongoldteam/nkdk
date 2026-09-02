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
import { buildProjectStateYamlFileUpdate } from "./projectStateYamlUpdate"

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

  it("строит structuredDocuments рабочей формы из результата первого прохода", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-state-yaml-update-"))
    tempDirs.push(projectDir)
    const componentDir = join(projectDir, "cf")
    const projectPath = "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml"
    const filePath = join(componentDir, ...projectPath.split("/"))
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(
      filePath,
      "Реквизиты:\n  Объект:\n    Тип: Строка\nЭлементы:\n  Поле:\n    Вид: ПолеВвода\n    ПутьКДанным: Объект\n",
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

    const update = buildProjectStateYamlFileUpdate({
      projectDir,
      descriptor: {
        componentPath: "cf",
        componentDir,
        rootProjectPath: `cf/${projectPath}`,
        projectPath,
        role: "form",
        indexContribution: "isolated",
      },
      firstPass,
      fileBackedTargets: [],
    })

    expect(update.structuredDocuments).toEqual(expect.arrayContaining([
      expect.objectContaining({
        documentKind: "clientApplicationForm",
        representation: "working",
        logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
        workingProjectPath: projectPath,
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
