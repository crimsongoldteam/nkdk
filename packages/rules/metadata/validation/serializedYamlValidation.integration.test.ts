import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { Type } from "typebox"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { explicitYAMLString } from "@nkdk/runtime"
import { serializeYAMLDocument } from "@nkdk/runtime"
import { mockContext, mockContextFromXML } from "../../tests/mockContext"
import { compileValidationSchema } from "./compileValidationSchema"
import { resolveValidationProjectFile } from "./projectFiles"
import { createProjectYamlCache } from "./projectYamlCache"
import { validateProjectFileFirstPass, type ValidationSchemaCache } from "./projectValidationPasses"
import { validateSerializedProjectYaml } from "../importFromXml/serializedYamlValidation"
import {
  createTestValidationRulesSnapshot,
  removeTrackedDirectories,
} from "./tests/validationTestSupport"

const tempDirs: string[] = []
const schema = compileValidationSchema(Type.Object({
  Реквизиты: Type.Object({
    Артикул: Type.Object({
      Тип: Type.String(),
      ЗначениеЗаполнения: Type.String(),
    }),
  }),
  ТранспортноеЗначение: Type.String(),
}))
const schemaCache: ValidationSchemaCache = {
  form: () => schema,
  properties: () => schema,
  compileAll: () => ({ formMs: 0, propertiesMs: 0, totalMs: 0 }),
}
let rulesSnapshot: ReturnType<typeof createTestValidationRulesSnapshot>

beforeAll(() => {
  rulesSnapshot = createTestValidationRulesSnapshot()
})

afterEach(() => {
  removeTrackedDirectories(tempDirs)
})

describe("validateSerializedProjectYaml", () => {
  it("проверяет смысловые данные ровно как записанный YAML", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-serialized-yaml-validation-"))
    tempDirs.push(projectDir)
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const absolutePath = join(projectDir, projectPath)
    const source = {
      Реквизиты: {
        Артикул: {
          Тип: "Строка",
          ЗначениеЗаполнения: explicitYAMLString("001"),
        },
      },
      ТранспортноеЗначение: "служебное значение",
    }
    const document = serializeYAMLDocument(source)
    mkdirSync(dirname(absolutePath), { recursive: true })
    writeFileSync(absolutePath, document.text)
    const file = resolveValidationProjectFile(projectDir, absolutePath)
    if (file === undefined) throw new Error("Не удалось классифицировать тестовый YAML")
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
      context: mockContextFromXML(),
      schemaCache,
      rulesSnapshot,
    })

    expect(withoutProfile(fromSerialized)).toEqual(withoutProfile(fromFile))
    expect(fromSerialized.schemaDiagnostics).toEqual([])
  })

  it("передаёт режим совместимости расширения в схему сериализованного YAML", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-serialized-yaml-extension-mode-"))
    tempDirs.push(projectDir)
    const projectPath = "Справочник/Товары/Свойства.yaml"
    const absolutePath = join(projectDir, projectPath)
    const document = serializeYAMLDocument({})
    const file = resolveValidationProjectFile(projectDir, absolutePath)
    if (file === undefined) throw new Error("Не удалось классифицировать тестовый YAML")
    const compatibilityModes: Array<string | undefined> = []
    const trackingSchemaCache: ValidationSchemaCache = {
      ...schemaCache,
      properties(_rule, _variant, compatibilityMode) {
        compatibilityModes.push(compatibilityMode)
        return schema
      },
    }
    const context = mockContextFromXML()
    context.fromXML.propertyStateCompatibilityMode = "Версия8_3_19"

    validateSerializedProjectYaml({
      projectDir,
      file,
      document,
      context,
      schemaCache: trackingSchemaCache,
      rulesSnapshot,
    })

    expect(compatibilityModes).toEqual(["Версия8_3_19"])
  })
})

function withoutProfile<T extends { profile?: unknown }>(value: T): Omit<T, "profile"> {
  const { profile: _profile, ...rest } = value
  return rest
}
