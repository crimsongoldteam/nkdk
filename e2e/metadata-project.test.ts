import { access, readFile, readdir, rm } from "node:fs/promises"
import { join, relative, resolve } from "node:path"
import { parseMetadataYaml, snapshotXmlAnomalyAnnotations, yamlScalarTagAt } from "@nkdk/runtime"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import {
  E2E_COMPONENTS,
  NKDK_FIXTURES_ROOT,
  cloneImportedProject,
  importMetadataProject,
  removeImportedProject,
  roundTripMetadataProject,
  validateChangedProject,
  validateCleanProject,
  type ImportedMetadataProject,
} from "./support/metadata-project"
import { compareFileTrees } from "./support/file-tree"

let baseline: ImportedMetadataProject | undefined

describe.sequential("metadata project E2E", () => {
  beforeAll(async () => {
    baseline = await importMetadataProject()
  })

  afterAll(async () => {
    if (baseline !== undefined) await removeImportedProject(baseline)
  })

  it("imports cf and every cfe with real workers", async () => {
    if (baseline === undefined) throw new Error("E2E import prerequisite did not complete")
    expect(baseline.results.map((result) => result.componentPath))
      .toEqual(E2E_COMPONENTS.map(({ componentPath }) => componentPath))
    for (const result of baseline.results) {
      expect(result.failed).toEqual([])
      expect(result.warnings).not.toContainEqual(expect.objectContaining({
        code: "xml_raw_scope_too_broad",
      }))
      expect(result.succeeded).toBeGreaterThan(0)
      expect(result.configurationIndexPath).toBe(join(
        baseline.projectDir,
        ".nkdk/components",
        result.componentPath!,
        "configuration-index.lmdb",
      ))
      await expect(access(result.configurationIndexPath!)).resolves.toBeUndefined()
    }
    for (const { componentPath } of E2E_COMPONENTS) {
      await expect(access(join(baseline.projectDir, componentPath, "Конфигурация.yaml")))
        .resolves.toBeUndefined()
    }
    const borrowedPredefinedYaml = await readFile(join(
      baseline.projectDir,
      "cfe/Расширение_All/БизнесПроцесс/БизнесПроцессВсеСвойстваExt/Свойства.yaml",
    ), "utf8")
    expect(borrowedPredefinedYaml).toContain(
      "ЗначениеЗаполнения: Справочник.СправочникРеквизит.ПредопредленноеЗначение",
    )
    expect(borrowedPredefinedYaml).not.toContain(
      "ЗначениеЗаполнения: !xml/invalid Справочник.СправочникРеквизит.ПредопредленноеЗначение",
    )
    const ordinaryValueYaml = await readFile(join(
      baseline.projectDir,
      "cfe/Расширение_All/Справочник/СправочникВладелецExt/Свойства.yaml",
    ), "utf8")
    expect(ordinaryValueYaml).toContain("ЗначениеЗаполнения: Истина")
    expect(ordinaryValueYaml).not.toContain("ЗначениеЗаполнения: !xml/value Истина")
    const settingsComposerYaml = await readFile(join(
      baseline.projectDir,
      "cf/ОбщаяФорма/КомпоновщикНастроек/Свойства.yaml",
    ), "utf8")
    expect(settingsComposerYaml).toContain(
      "ПутьКДанным: КомпоновщикНастроек.Настройки.КартинкаСтруктурыОтчета",
    )
    expect(settingsComposerYaml).not.toContain("Settings.ReportStructurePicture")
    expect(settingsComposerYaml).toContain(
      "ПутьКДанным: КомпоновщикНастроек.Настройки.СтруктураОтчета",
    )
    expect(settingsComposerYaml).toContain(
      "ПутьКДанным: КомпоновщикНастроек.ФиксированныеНастройки.СтруктураОтчета",
    )
    expect(settingsComposerYaml).not.toContain("!xml/value КомпоновщикНастроек.Settings.ReportStructure")
    expect(settingsComposerYaml).not.toContain("!xml/value КомпоновщикНастроек.FixedSettings.ReportStructure")
    const valueListYaml = await readFile(join(
      baseline.projectDir,
      "cf/ОбщаяФорма/СписокЗначений/Свойства.yaml",
    ), "utf8")
    expect(valueListYaml).not.toContain("Форма: !xml/raw")
    expect(valueListYaml).toContain('"@Form\\\\ТипЗначения": !xml/raw')
    expect(valueListYaml).toContain("$xml: null")
    const anomalies = await collectXmlAnomalyLocations(baseline.projectDir)
    expect(anomalies.invalid).toEqual([])
    expect(anomalies.raw).toEqual(EXPECTED_XML_RAW_LOCATIONS)
    expect(anomalies.string).toEqual(EXPECTED_XML_STRING_LOCATIONS)
    await expect(access(join(baseline.projectDir, ".nkdk"))).resolves.toBeUndefined()
    console.info("E2E import durations, ms", baseline.durationsMs)
  })

  it("matches the committed NKDK project byte for byte", async () => {
    if (baseline === undefined) throw new Error("E2E import prerequisite did not complete")
    const reportDir = resolve(import.meta.dirname, "../reports/e2e/nkdk-import")
    const projectDir = await cloneImportedProject(baseline, "nkdk-import-comparison")
    await rm(reportDir, { recursive: true, force: true })
    await rm(join(projectDir, ".nkdk"), { recursive: true, force: true })
    try {
      const comparison = await compareFileTrees({
        expectedDir: NKDK_FIXTURES_ROOT,
        actualDir: projectDir,
        reportDir,
      })

      expect(comparison, comparison.reportDir).toMatchObject({
        equal: true,
        added: [],
        removed: [],
        changed: [],
      })
    } finally {
      await rm(projectDir, { recursive: true, force: true })
    }
  })

  it("validates a clean project and reports the same changed YAML without .nkdk", async () => {
    if (baseline === undefined) throw new Error("E2E import prerequisite did not complete")
    const projectDir = await cloneImportedProject(baseline, "validation")
    const clean = await validateCleanProject(projectDir)
    const result = await validateChangedProject(projectDir)

    expect(result.cold).toEqual(result.warm)
    const ownRequired = result.warm.filter(({ filePath, path }) =>
      filePath.includes("cfe/Расширение_All/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойстваExt/")
      && path === "/ИмяВИсточникеДанных"
    )
    expect(ownRequired).toHaveLength(1)
    expect(ownRequired[0]).toMatchObject({
      filePath: expect.stringContaining("cfe/Расширение_All/"),
      severity: "error",
      source: "structure",
      path: "/ИмяВИсточникеДанных",
    })
    expect(ownRequired[0]?.message).toContain("обязательное")
    expect(clean).toEqual([])
    expect(result.warm).toHaveLength(1)
    console.info("E2E validation durations, ms", result.durationsMs)
  })

  it("restores every XML component exactly", async () => {
    if (baseline === undefined) throw new Error("E2E import prerequisite did not complete")
    const projectDir = await cloneImportedProject(baseline, "round-trip")
    const reportRoot = resolve(import.meta.dirname, "../reports/e2e/round-trip")
    const results = await roundTripMetadataProject({ projectDir, reportRoot })

    expect(results.map(({ component }) => component.componentPath))
      .toEqual(E2E_COMPONENTS.map(({ componentPath }) => componentPath))
    for (const result of results) {
      expect(result.sync.failed, JSON.stringify(result.sync.diagnostics, null, 2)).toEqual([])
      if (result.kind !== "compared") {
        throw new Error(`Sync ${result.component.componentPath} завершился без сравнения`)
      }
      expect.soft(result.comparison, result.comparison.reportDir).toMatchObject({
        equal: true,
        added: [],
        removed: [],
        changed: [],
      })
    }
    console.table(results.map(({ component, durationMs }) => ({
      component: component.componentPath,
      durationMs,
    })))
  })
})

const RARE_FILL_VALUE_XML_RAW_LOCATIONS = [
  "cf/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/Свойства.yaml#/Поля/ПолеВсеСвойства/ЗначениеЗаполнения",
  "cf/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойства/Таблицы/ТаблицаВсеСвойства/Свойства.yaml#/Поля/ПолеВсеСвойства/ЗначениеЗаполнения",
  "cf/Справочник/СправочникВладелец/Свойства.yaml#/Реквизиты/РеквизитСтрока/ЗначениеЗаполнения",
  "cf/Справочник/СправочникПолный/Свойства.yaml#/Реквизиты/РеквизитЧисло/ЗначениеЗаполнения",
  "cfe/Расширение_All/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойстваExt/Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/Свойства.yaml#/Поля/ПолеВсеСвойства/ЗначениеЗаполнения",
  "cfe/Расширение_All/ВнешнийИсточникДанных/ВнешнийИсточникДанныхВсеСвойстваExt/Таблицы/ТаблицаВсеСвойства/Свойства.yaml#/Поля/ПолеВсеСвойства/ЗначениеЗаполнения",
  "cfe/Расширение_All/Справочник/СправочникВладелецExt/Свойства.yaml#/Реквизиты/РеквизитСтрока/ЗначениеЗаполнения",
  "cfe/Расширение_All/Справочник/СправочникПолныйExt/Свойства.yaml#/Реквизиты/РеквизитЧисло/ЗначениеЗаполнения",
] as const

const VALUE_LIST_SETTINGS_XML_RAW_LOCATIONS = [
  "cf/ОбщаяФорма/СписокЗначений/Свойства.yaml#/Форма/Реквизиты/СписокЗначенийПроизвольный/@Form\\ТипЗначения",
  "cf/ОбщаяФорма/ФормаПоиска/Свойства.yaml#/Форма/Реквизиты/ЗначенияРезультата/@Form\\ТипЗначения",
  "cf/ОбщаяФорма/ФормаПоиска/Свойства.yaml#/Форма/Реквизиты/ПоследниеЗапросы/@Form\\ТипЗначения",
] as const

const EXPECTED_XML_RAW_LOCATIONS = [
  ...RARE_FILL_VALUE_XML_RAW_LOCATIONS,
  ...VALUE_LIST_SETTINGS_XML_RAW_LOCATIONS,
].sort(compareUtf8)

const DYNAMIC_LIST_FILE = "cf/ОбщаяФорма/ДинамическийСписок/Свойства.yaml"
const EXPECTED_XML_STRING_LOCATIONS = [
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПроизвольныйЗапрос/ДинамическийСписок/Отбор/ПредставлениеПользовательскойНастройки`,
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПроизвольныйЗапрос/ДинамическийСписок/Отбор/Элементы/1/Представление`,
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПроизвольныйЗапрос/ДинамическийСписок/Порядок/ПредставлениеПользовательскойНастройки`,
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПроизвольныйЗапрос/ДинамическийСписок/УсловноеОформление/ПредставлениеПользовательскойНастройки`,
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/СОсновнойТаблицей/ДинамическийСписок/Отбор/Элементы/0/Представление`,
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/СОсновнойТаблицей/ДинамическийСписок/Отбор/Элементы/0/ПредставлениеПользовательскойНастройки`,
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПоУмолчанию1/ДинамическийСписок/Отбор/ПредставлениеПользовательскойНастройки`,
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/ПоУмолчанию1/ДинамическийСписок/Отбор/Элементы/0/Представление`,
  `${DYNAMIC_LIST_FILE}#/Форма/Реквизиты/УсловноеОформлениеНесколькоСтрок/ДинамическийСписок/УсловноеОформление/ПредставлениеПользовательскойНастройки`,
].sort(compareUtf8)

async function collectXmlAnomalyLocations(projectDir: string): Promise<{
  readonly raw: readonly string[]
  readonly invalid: readonly string[]
  readonly string: readonly string[]
}> {
  const raw: string[] = []
  const invalid: string[] = []
  const string: string[] = []
  for (const filePath of await yamlFiles(projectDir)) {
    const parsed = parseMetadataYaml(await readFile(filePath, "utf8"))
    if (parsed.syntaxErrors.length > 0) {
      throw new Error(`Некорректный YAML ${relative(projectDir, filePath)}`)
    }
    const snapshot = snapshotXmlAnomalyAnnotations(parsed.data, parsed.annotations)
    if (snapshot.root !== undefined) {
      if (snapshot.root.kind === "raw") {
        assertMinimalXmlRaw(snapshot.root.xml, `${relative(projectDir, filePath)}#/$`)
      }
      anomalyBucket(snapshot.root.kind, raw, invalid)?.push(`${relative(projectDir, filePath)}#/$`)
    }
    for (const entry of snapshot.entries) {
      const location = `${relative(projectDir, filePath)}#/${[...entry.parentPath, entry.key].map(String).join("/")}`
      if (entry.annotation.kind === "raw") assertMinimalXmlRaw(entry.annotation.xml, location)
      anomalyBucket(entry.annotation.kind, raw, invalid)?.push(
        location,
      )
    }
    collectXmlStringLocations({
      value: parsed.data,
      file: relative(projectDir, filePath),
      path: [],
      result: string,
    })
  }
  return {
    raw: raw.sort(compareUtf8),
    invalid: invalid.sort(compareUtf8),
    string: string.sort(compareUtf8),
  }
}

function assertMinimalXmlRaw(value: unknown, location: string): void {
  if (Array.isArray(value)) {
    if (value.some((item) => item !== null && typeof item === "object")) {
      throw new Error(`${location}: raw не должен содержать полную замену повторяющихся XML-объектов`)
    }
    return
  }
  if (value === null || typeof value !== "object") return
  for (const nested of Object.values(value)) assertMinimalXmlRaw(nested, location)
}

function collectXmlStringLocations(params: {
  readonly value: unknown
  readonly file: string
  readonly path: readonly (string | number)[]
  readonly result: string[]
}): void {
  if (params.value === null || typeof params.value !== "object") return
  const entries = Array.isArray(params.value)
    ? params.value.map((value, index) => [index, value] as const)
    : Object.entries(params.value)
  for (const [key, value] of entries) {
    const path = [...params.path, key]
    if (yamlScalarTagAt(params.value, key) === "xml/string") {
      params.result.push(`${params.file}#/${path.map(String).join("/")}`)
    }
    collectXmlStringLocations({ ...params, value, path })
  }
}

function anomalyBucket(
  kind: string,
  raw: string[],
  invalid: string[],
): string[] | undefined {
  if (kind === "raw") return raw
  if (kind === "invalid") return invalid
  return undefined
}

async function yamlFiles(directory: string): Promise<readonly string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = join(directory, entry.name)
    if (entry.isDirectory()) result.push(...await yamlFiles(filePath))
    else if (entry.isFile() && entry.name.endsWith(".yaml")) result.push(filePath)
  }
  return result
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left), Buffer.from(right))
}
