import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "~/metadata/commonObjects/metadataTargets"
import type { ParsedMetadataTarget } from "~/metadata/commonObjects/metadataTargets/types"
import { mockContext } from "~/tests/mockContext"
import { createProjectMetadataResolver } from "./projectMetadataResolver"
import { createProjectYamlCache } from "./projectYamlCache"

describe("ProjectMetadataResolver", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("resolves top-level objects from project YAML", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Контрагенты/Свойства.yaml", "Комментарий: ok")
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({ target: objectTarget("Справочник.Контрагенты") })).toMatchObject({
      ok: true,
      filePath: join(projectDir, "Справочник", "Контрагенты", "Свойства.yaml"),
    })
  })

  it("reports unknown objects through reference diagnostics", () => {
    const projectDir = createProject()
    const resolver = createResolver(projectDir)

    expect(resolver.resolveObject({ target: { kind: "object", root: "Catalog", objectName: "НетТакого" } })).toMatchObject({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          source: "reference",
          severity: "error",
          message: 'Не найден объект "Справочник.НетТакого"',
        }),
      ],
    })
  })

  it("resolves fields including standard attributes and tabular-section attributes", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
      "ТабличныеЧасти:",
      "  Товары:",
      "    Реквизиты:",
      "      Количество:",
      "        Тип: Число",
    ])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveField({ target: fieldTarget("Справочник.Номенклатура.СтандартныйРеквизит.Наименование") })).toMatchObject({
      ok: true,
    })

    expect(
      resolver.resolveField({
        target: fieldTarget("Справочник.Номенклатура.ТабличнаяЧасть.Товары.Реквизит.Количество"),
      }),
    ).toMatchObject({ ok: true })
  })

  it("resolves predefined values, enum values and EmptyRef", () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Справочник/СтавкиНДС/Свойства.yaml", [
      "Предопределенные:",
      "  БезНДС:",
      "    Код: \"000000001\"",
      "    Наименование: Без НДС",
    ])
    writeProjectFile(projectDir, "Перечисление/ВидыДоговоров/Свойства.yaml", [
      "Значения:",
      "  СПоставщиком:",
      "    Синоним: С поставщиком",
    ])
    const resolver = createResolver(projectDir)

    expect(resolver.resolveValue({ target: valueTarget("Справочник.СтавкиНДС.ПустаяСсылка") })).toMatchObject({ ok: true })
    expect(resolver.resolveValue({ target: valueTarget("Справочник.СтавкиНДС.БезНДС") })).toMatchObject({ ok: true })
    expect(resolver.resolveValue({ target: valueTarget("Перечисление.ВидыДоговоров.СПоставщиком") })).toMatchObject({
      ok: true,
    })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-project-resolver-"))
    tempDirs.push(projectDir)
    return projectDir
  }
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(dirname(filePath), { recursive: true })
  const text = Array.isArray(lines) ? lines.join("\n") : lines
  writeFileSync(filePath, `${text.trimEnd()}\n`)
}

function createResolver(projectDir: string) {
  return createProjectMetadataResolver({
    projectDir,
    yamlCache: createProjectYamlCache(),
    context: mockContext,
  })
}

function objectTarget(value: string): Extract<ParsedMetadataTarget, { kind: "object" }> {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "object" } })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "object" }>
}

function fieldTarget(value: string): Extract<ParsedMetadataTarget, { kind: "field" }> {
  const parsed = parseMetadataTargetFromYAML({ value, constraint: { kind: "field", owner: "explicit" } })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "field" }>
}

function valueTarget(value: string): Extract<ParsedMetadataTarget, { kind: "value" }> {
  const parsed = parseMetadataTargetFromYAML({
    value,
    constraint: { kind: "value", valueKinds: ["predefinedValue", "enumValue", "emptyRef"], allowEmptyRef: true },
  })
  if (!parsed.ok) throw new Error(parsed.message)
  return parsed.target as Extract<ParsedMetadataTarget, { kind: "value" }>
}
