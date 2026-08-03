import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { mockContext } from "../../tests/mockContext"
import { resolveValidationProjectFile } from "./projectFiles"
import { createProjectYamlCache } from "./projectYamlCache"
import { validateProjectFileFirstPass } from "./projectValidationPasses"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { createTestValidationSchemaCache } from "./testing/testValidationSchemaCache"
import { validateKnownProjectYaml } from "./knownYamlValidation"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("validateKnownProjectYaml", () => {
  it("совпадает с файловой проверкой и не изменяет готовый YAML", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-known-yaml-validation-"))
    tempDirs.push(projectDir)
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const absolutePath = join(projectDir, projectPath)
    const text = ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n")
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, text)
    const file = resolveValidationProjectFile(projectDir, absolutePath)
    if (file === undefined) throw new Error("Не удалось классифицировать тестовый YAML")
    const schemaCache = createTestValidationSchemaCache()
    const rulesSnapshot = createValidationRulesSnapshot(mockContext)
    const yaml = Object.freeze(parseMetadataYaml(text).data as object)

    const fromFile = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache,
      rulesSnapshot,
    })
    const fromKnown = validateKnownProjectYaml({
      projectDir,
      file,
      text,
      yaml,
      context: mockContext,
      schemaCache,
      rulesSnapshot,
    })

    expect(withoutProfile(fromKnown)).toEqual(withoutProfile(fromFile))
    expect(yaml).toEqual({ Реквизиты: { Артикул: { Тип: "Строка" } } })
  })
})

function withoutProfile<T extends { profile?: unknown }>(value: T): Omit<T, "profile"> {
  const { profile: _profile, ...rest } = value
  return rest
}
