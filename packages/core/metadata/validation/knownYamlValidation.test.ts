import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { mockContext } from "../../tests/mockContext"
import { resolveValidationProjectFile } from "./projectFiles"
import { createProjectYamlCache } from "./projectYamlCache"
import { createValidationSchemaCache, validateProjectFileFirstPass } from "./projectValidationPasses"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { createTestValidationSchemaCache } from "./tests/testValidationSchemaCache"
import { validateKnownProjectYaml } from "../importFromXml/knownYamlValidation"
import { registerCoreMetadata } from "../register"

registerCoreMetadata()

const tempDirs: string[] = []
const fillValueProjectDir = "/project"
const fillValueFile = resolveValidationProjectFile(
  fillValueProjectDir,
  "/project/Справочник/Товары/Свойства.yaml",
)
if (fillValueFile === undefined) throw new Error("Не удалось классифицировать тестовый YAML")
const fullSchemaCache = createValidationSchemaCache(mockContext)
fullSchemaCache.properties(fillValueFile.owner.spec.rule)
const fullRulesSnapshot = createValidationRulesSnapshot(mockContext)

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

  it("returns one dependent diagnostic for an implicit fill value", () => {
    const text = 'Реквизиты:\n  Артикул:\n    Тип: Строка(250)\n    ЗначениеЗаполнения: ""\n'

    const result = validateKnownProjectYaml({
      projectDir: fillValueProjectDir,
      file: fillValueFile,
      text,
      yaml: parseMetadataYaml(text).data,
      context: mockContext,
      schemaCache: fullSchemaCache,
      rulesSnapshot: fullRulesSnapshot,
    })

    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        path: "/Реквизиты/Артикул/ЗначениеЗаполнения",
        message: expect.stringContaining("неявное значение"),
      }),
    ])
  })
})

function withoutProfile<T extends { profile?: unknown }>(value: T): Omit<T, "profile"> {
  const { profile: _profile, ...rest } = value
  return rest
}
