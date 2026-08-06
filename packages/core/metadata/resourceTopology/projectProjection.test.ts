import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import type { MetadataItemRule } from "../orchestration/property/types"
import type { RegisteredProjectSpec } from "../project/projectSpecRegistry"
import { compileMetadataResourceTopology } from "./compiler"
import {
  classifyMetadataProjectPath,
  createMetadataProjectPathClassifier,
  iterateMetadataProjectPathCandidates,
  iterateProjectFiles,
  listProjectFiles,
} from "./projectProjection"

const rule = { itemType: "TestObject", properties: {} } as MetadataItemRule
const source = { kind: "itemRule" as const, description: "test" }
const projectDir = resolve("/project")

const topology = compileMetadataResourceTopology([
  {
    dir: "Объект",
    kind: "test",
    rule,
    exportSchema: () => ({}) as never,
    resources: [
      {
        kind: "content",
        projectPattern: "Объект/{ownerName}/Свойства.yaml",
        role: "properties",
        required: true,
        repeatable: true,
        compositionImpact: "configurationComposition",
        itemRule: rule,
        source,
      },
      {
        kind: "externalFile",
        assignmentProjectPattern: "",
        projectPattern: "Объект/{ownerName}/Модуль.bsl",
        xmlPattern: "Objects/{ownerName}/Module.bsl",
        direction: "both",
        transferCapabilityId: "copy",
        compositionImpact: "none",
        source,
      },
      {
        kind: "ignore",
        side: "project",
        pattern: ".service/{rest...}",
        source,
      },
    ],
  } satisfies RegisteredProjectSpec,
])

describe("project resource topology projection", () => {
  it("переиспользуемый классификатор сохраняет результат точечной классификации", () => {
    const classify = createMetadataProjectPathClassifier(topology)
    for (const path of [
      "Объект/Первый/Свойства.yaml",
      "Объект/Первый/Модуль.bsl",
      ".service/cache.bin",
      "Объект/Первый/Лишний.yaml",
    ]) {
      expect(classify(path)).toEqual(classifyMetadataProjectPath(topology, path))
    }
  })

  it("читает не больше 32 каталогов параллельно", async () => {
    let active = 0
    let maxActive = 0
    const rootEntries = Array.from({ length: 40 }, (_unused, index) => directory(`dir-${index}`))

    const files = await listProjectFiles(projectDir, async (path) => {
      if (path === projectDir) return rootEntries
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
      active -= 1
      return [file("data.yaml")]
    })

    expect(files).toHaveLength(40)
    expect(maxActive).toBe(32)
  })

  it("выдаёт найденный файл до чтения следующего уровня каталогов", async () => {
    let nestedRead = false
    const files = iterateProjectFiles(projectDir, async (path) => {
      if (path === projectDir) return [file("first.yaml"), directory("nested")]
      nestedRead = true
      return [file("second.yaml")]
    })

    await expect(files.next()).resolves.toMatchObject({ value: join(projectDir, "first.yaml"), done: false })
    expect(nestedRead).toBe(false)
    await expect(files.next()).resolves.toMatchObject({ value: join(projectDir, "nested", "second.yaml"), done: false })
    expect(nestedRead).toBe(true)
  })

  it("переносит курсор по каталогам и не читает недостижимую ветвь", async () => {
    const readDirectories: string[] = []
    const entries = new Map<string, ReturnType<typeof file>[]>([
      [projectDir, [directory("Объект"), directory(".service"), directory("НедостижимаяВетка")]],
      [join(projectDir, "Объект"), [directory("Первый")]],
      [join(projectDir, "Объект", "Первый"), [file("Свойства.yaml"), file("Модуль.bsl"), file("Лишний.yaml")]],
      [join(projectDir, ".service"), [file("cache.bin")]],
    ])

    const candidates = []
    for await (const candidate of iterateMetadataProjectPathCandidates({
      topology,
      projectDir,
      readDirectory: async (path) => {
        readDirectories.push(path)
        return entries.get(path) ?? []
      },
    })) candidates.push(candidate)

    const expectedPaths = [
      ".service/cache.bin",
      "Объект/Первый/Свойства.yaml",
      "Объект/Первый/Модуль.bsl",
    ]
    expect(readDirectories).not.toContain(join(projectDir, "НедостижимаяВетка"))
    expect(candidates.map(({ projectPath }) => projectPath)).toEqual(expectedPaths)
    expect(candidates.map((candidate) => candidate.classify())).toEqual(
      expectedPaths.map((path) => classifyMetadataProjectPath(topology, path)),
    )
  })

  it("откладывает ошибку неоднозначного пути до классификации кандидата", async () => {
    const ambiguous = compileMetadataResourceTopology([
      {
        dir: "",
        kind: "test",
        rule,
        exportSchema: () => ({}) as never,
        resources: [
          {
            kind: "content",
            projectPattern: "Файл.yaml",
            role: "properties",
            required: true,
            repeatable: false,
            compositionImpact: "none",
            itemRule: rule,
            source,
          },
          { kind: "ignore", side: "project", pattern: "Файл.yaml", source },
        ],
      } satisfies RegisteredProjectSpec,
    ])
    const candidates = iterateMetadataProjectPathCandidates({
      topology: ambiguous,
      projectDir: "/project",
      readDirectory: async () => [file("Файл.yaml")],
    })
    const candidate = (await candidates.next()).value

    expect(candidate?.projectPath).toBe("Файл.yaml")
    expect(() => candidate?.classify()).toThrow("Путь Проекта принадлежит нескольким ресурсам: Файл.yaml")
  })

  it.each([
    ["Объект/Первый/Свойства.yaml", "content", "properties"],
    ["Объект/Первый/Модуль.bsl", "externalFile", "external"],
    [".service/cache.bin", "ignore", "external"],
  ] as const)("classifies %s", (path, kind, role) => {
    expect(classifyMetadataProjectPath(topology, path)).toMatchObject({ kind, role })
  })

  it("rejects paths outside the topology", () => {
    expect(classifyMetadataProjectPath(topology, "Объект/Первый/Лишний.yaml")).toBeUndefined()
  })
})

function directory(name: string) {
  return { name, isDirectory: () => true, isFile: () => false }
}

function file(name: string) {
  return { name, isDirectory: () => false, isFile: () => true }
}
