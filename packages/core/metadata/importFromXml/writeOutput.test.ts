import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { explicitYAMLString } from "../../yaml/explicitString"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { createOperationProfiler } from "../validation/profile"
import type { ImportAssignment } from "./types"
import {
  serializeImportYaml,
  writeGeneratedImportFiles,
  writeMainImportYaml,
  xmlExternalImportFiles,
} from "./writeOutput"

const tempDirs: string[] = []
const profiler = createOperationProfiler({
  operation: "import-from-xml",
  scope: { scope: "worker", workerIndex: 0 },
})

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe("XML import output", () => {
  it("возвращает смысловые данные тех же YAML-байтов", () => {
    const serialized = serializeImportYaml({
      output: {
        sourceKind: "worker",
        sourcePath: "/project/cf/Справочник/Товары/Свойства.yaml",
        targetProjectPath: "Справочник/Товары/Свойства.yaml",
      },
      yaml: { ЗначениеЗаполнения: explicitYAMLString("001") },
    })

    expect(serialized.text).toBe('ЗначениеЗаполнения: "001"')
    expect(serialized.data).toEqual({ ЗначениеЗаполнения: "001" })
    expect(serialized.data).toEqual(parseMetadataYaml(serialized.text).data)
  })

  it("сериализует пустые тела именованной коллекции без фигурных скобок", () => {
    const serialized = serializeImportYaml({
      output: {
        sourceKind: "worker",
        sourcePath: "/project/cf/Перечисление/Виды/Свойства.yaml",
        targetProjectPath: "Перечисление/Виды/Свойства.yaml",
      },
      yaml: { Значения: { Первый: {}, Второй: {} } },
    })

    expect(serialized.text).toBe("Значения:\n  Первый:\n  Второй:")
    expect(serialized.data).toEqual(parseMetadataYaml(serialized.text).data)
  })

  it("writes generated files relative to the main YAML directory", async () => {
    const outputDir = createTempDir()

    const generated = await writeGeneratedImportFiles({
      outputDir,
      targetProjectPath: "Справочник/Товары/Формы/Форма/Форма.yaml",
      generatedFiles: [
        { relativePath: "ДинамическийСписок/Список.query", content: "ВЫБРАТЬ 1" },
        { relativePath: "Модуль.bsl", content: "Процедура Тест() КонецПроцедуры" },
      ],
      profiler,
    })

    expect(generated.map(({ targetProjectPath }) => targetProjectPath)).toEqual([
      "Справочник/Товары/Формы/Форма/ДинамическийСписок/Список.query",
      "Справочник/Товары/Формы/Форма/Модуль.bsl",
    ])
    expect(readFileSync(generated[0]!.sourcePath, "utf-8")).toBe("ВЫБРАТЬ 1")
    expect(readFileSync(generated[1]!.sourcePath, "utf-8")).toBe("Процедура Тест() КонецПроцедуры")
  })

  it("serializes one main YAML file and reports its UTF-8 size", async () => {
    const outputDir = createTempDir()

    const result = await writeMainImportYaml({
      outputDir,
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      yaml: { Имя: "Тест" },
      profiler,
    })

    expect(result.file).toEqual({
      sourceKind: "worker",
      sourcePath: join(outputDir, "Справочник/Товары/Свойства.yaml"),
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
    })
    expect(readFileSync(result.file.sourcePath, "utf-8")).toBe("Имя: Тест")
    expect(result.bytes).toBe(Buffer.byteLength("Имя: Тест", "utf-8"))
  })

  it("записывает ровно те bytes, по которым уже вычислен xxHash64", async () => {
    const outputDir = createTempDir()
    const serialized = serializeImportYaml({
      output: {
        sourceKind: "worker",
        sourcePath: join(outputDir, "Справочник/Товары/Свойства.yaml"),
        targetProjectPath: "Справочник/Товары/Свойства.yaml",
      },
      yaml: { Имя: "Тест" },
    })

    const result = await writeMainImportYaml({ serialized, profiler })

    expect(readFileSync(result.file.sourcePath)).toEqual(Buffer.from(serialized.bytes))
    expect(serialized.localHash).toBeTypeOf("bigint")
    expect(result.bytes).toBe(serialized.bytes.byteLength)
  })

  it("describes source XML external files without copying them", () => {
    const assignment: ImportAssignment = {
      id: "catalog-help",
      role: "fileItem",
      targetProjectPath: "Справочник/Товары/Свойства.yaml",
      itemType: "MetadataCatalog",
      itemName: "Товары",
      logicalAddress: "Справочник.Товары",
      owner: undefined,
      xmlFiles: [],
      externalFiles: [
        {
          sourcePath: "/xml/Catalogs/Товары/Ext/Help.xml",
          targetProjectPath: "Справочник/Товары/Справка.xml",
        },
      ],
    }

    expect(xmlExternalImportFiles(assignment)).toEqual([
      {
        sourceKind: "xml",
        sourcePath: "/xml/Catalogs/Товары/Ext/Help.xml",
        targetProjectPath: "Справочник/Товары/Справка.xml",
      },
    ])
  })
})

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "nkdk-import-write-output-"))
  tempDirs.push(dir)
  return dir
}
