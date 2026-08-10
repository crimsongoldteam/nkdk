import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { createProjectYamlCache } from "../validation/projectYamlCache"
import { validateProjectFileFirstPass } from "../validation/projectValidationPasses"
import { createValidationRulesSnapshot } from "../validation/rulesSnapshot"
import { createTestValidationSchemaCache } from "../validation/tests/testValidationSchemaCache"
import { buildProjectStateYamlFileUpdate } from "./projectStateYamlUpdate"

describe("buildProjectStateYamlFileUpdate", () => {
  const tempDirs: string[] = []
  const schemaCache = createTestValidationSchemaCache()

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
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
      rulesSnapshot: createValidationRulesSnapshot(mockContext),
    })

    const update = buildProjectStateYamlFileUpdate({
      projectDir,
      descriptor: {
        componentPath: "cf",
        componentDir,
        rootProjectPath: `cf/${projectPath}`,
        projectPath,
        role: "form",
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
  })
})
