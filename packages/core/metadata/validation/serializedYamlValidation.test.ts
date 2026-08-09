import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { Type } from "typebox"
import { afterEach, describe, expect, it } from "vitest"
import { explicitYAMLString } from "../../yaml/explicitString"
import { serializeYAMLDocument } from "../../yaml/export"
import { mockContext } from "../../tests/mockContext"
import { compileValidationSchema } from "./compileValidationSchema"
import { resolveValidationProjectFile } from "./projectFiles"
import { createProjectYamlCache } from "./projectYamlCache"
import { validateProjectFileFirstPass, type ValidationSchemaCache } from "./projectValidationPasses"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { validateSerializedProjectYaml } from "../importFromXml/serializedYamlValidation"

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("validateSerializedProjectYaml", () => {
  it("проверяет смысловые данные ровно как записанный YAML", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-serialized-yaml-validation-"))
    tempDirs.push(projectDir)
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const absolutePath = join(projectDir, projectPath)
    const document = serializeYAMLDocument({
      Реквизиты: {
        Артикул: {
          Тип: "Строка",
          ЗначениеЗаполнения: explicitYAMLString("001"),
        },
      },
    })
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, document.text)
    const file = resolveValidationProjectFile(projectDir, absolutePath)
    if (file === undefined) throw new Error("Не удалось классифицировать тестовый YAML")
    const schema = compileValidationSchema(Type.Object({
      Реквизиты: Type.Object({
        Артикул: Type.Object({
          Тип: Type.String(),
          ЗначениеЗаполнения: Type.String(),
        }),
      }),
    }))
    const schemaCache: ValidationSchemaCache = {
      form: () => schema,
      properties: () => schema,
      compileAll: () => ({ formMs: 0, propertiesMs: 0, totalMs: 0 }),
    }
    const rulesSnapshot = createValidationRulesSnapshot(mockContext)

    const fromFile = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache,
      rulesSnapshot,
    })
    const fromSerialized = validateSerializedProjectYaml({
      projectDir,
      file,
      document,
      context: mockContext,
      schemaCache,
      rulesSnapshot,
    })

    expect(withoutProfile(fromSerialized)).toEqual(withoutProfile(fromFile))
    expect(fromSerialized.schemaDiagnostics).toEqual([])
  })
})

function withoutProfile<T extends { profile?: unknown }>(value: T): Omit<T, "profile"> {
  const { profile: _profile, ...rest } = value
  return rest
}
