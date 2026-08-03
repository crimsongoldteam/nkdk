import { expect, it, vi } from "vitest"
import type { ProjectTargetLookup } from "../readSession"
import { ProjectStateReadSessionClosedError } from "../readSession"
import { buildProjectStateSnapshot } from "./builder"
import { createBinaryProjectStateQueryPort, openBinaryProjectStateReadSession } from "./readSession"
import { createBinaryProjectStateReadToken } from "./readToken"
import { ProjectStateSnapshotView } from "./snapshot"
import { richYamlUpdate } from "./testData"
import { createProjectStateFragmentWriter, openProjectStateFragment } from "./fragment"

it("соблюдает видимость cf и собственного расширения", () => {
  const session = openSessionWithUpdates([
    richYamlUpdate("cf/base.yaml", "cf", "Catalog.Base"),
    richYamlUpdate("cfe/Цены/own.yaml", "cfe/Цены", "Catalog.Extension"),
    richYamlUpdate("cfe/Скидки/foreign.yaml", "cfe/Скидки", "Catalog.Foreign"),
  ])

  expect(session.resolveTargets([
    lookup("base", "cfe/Цены", "Catalog.Base"),
    lookup("own", "cfe/Цены", "Catalog.Extension"),
    lookup("foreign", "cfe/Цены", "Catalog.Foreign"),
  ]).map(({ status }) => status)).toEqual(["found", "found", "missing"])
})

it("возвращает ambiguous вместо произвольной записи", () => {
  const session = openSessionWithUpdates([
    richYamlUpdate("cf/a.yaml", "cf", "Catalog.Duplicate"),
    richYamlUpdate("cf/b.yaml", "cf", "Catalog.Duplicate"),
  ])

  expect(session.resolveTargets([lookup("duplicate", "cf", "Catalog.Duplicate")]))
    .toEqual([{ requestId: "duplicate", status: "ambiguous" }])
})

it("читает владельца и входы проверки зависимостей из выбранного файла", () => {
  const update = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const session = openSessionWithUpdates([update])
  const owner = { kind: "Справочник", name: "Catalog.Source" }

  expect(session.readOwners([{ requestId: "owner", componentPath: "cf", owner }]))
    .toEqual([{
      requestId: "owner",
      status: "found",
      facts: { registerType: "InformationRegister" },
    }])
  expect(session.readDependencyInputs([{
    requestId: "dependency",
    componentPath: "cf",
    projectPath: update.projectPath,
    check: {
      kind: "dataPath",
      yamlPath: ["ПутьКДанным"],
      location: { line: 1, col: 1 },
      owner,
      value: "Объект.Код",
      policyInput: { yaml: "ПутьКДанным" },
      policy: "formDataPath",
    },
  }])).toMatchObject([{
    requestId: "dependency",
    status: "found",
    input: {
      owners: [{ owner }],
      fields: [{ name: "Код" }, { name: "Описание" }, { name: "Артикул" }],
      forms: [{ name: "Объект" }],
    },
  }])
})

it("находит точные и префиксные metadata-ссылки", () => {
  const update = richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")
  const session = openSessionWithUpdates([update])

  expect(session.findReferences([
    { requestId: "exact", componentPath: "cf", canonical: "Catalog.Товары" },
    { requestId: "prefix", componentPath: "cf", canonical: "Catalog", match: "prefix" },
  ])).toEqual([
    {
      requestId: "exact",
      references: [{
        kind: "metadataTarget",
        projectPath: update.projectPath,
        componentPath: "cf",
        yamlPath: ["Ссылка"],
        canonical: "Catalog.Товары",
      }],
    },
    {
      requestId: "prefix",
      references: [{
        kind: "metadataTarget",
        projectPath: update.projectPath,
        componentPath: "cf",
        yamlPath: ["Ссылка"],
        canonical: "Catalog.Товары",
      }],
    },
  ])
})

it("возвращает страницы целей, владельцев и состояние локальной проверки", () => {
  const session = openSessionWithUpdates([
    richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source"),
  ])

  expect(session.readOwnerRefPage({ componentPath: "cf", kind: "Справочник" }))
    .toEqual({ refs: [{ kind: "Справочник", name: "Catalog.Source" }] })
  expect(session.readComponentTargetPage({ componentPath: "cf" })).toEqual({
    entries: [{ logicalAddress: "Catalog.Source", sourceProjectPath: "cf/source.yaml" }],
  })
  expect(session.readValidationStatus({ offset: 0, batchSize: 1 })).toEqual([{
    projectPath: "cf/source.yaml",
    componentPath: "cf",
    schemaReady: true,
    contributedFacts: true,
  }])
})

it("отвергает запросы после закрытия", () => {
  const session = openSessionWithUpdates([])
  session.close()

  expect(() => session.resolveTargets([])).toThrow(ProjectStateReadSessionClosedError)
})

it("не обращается к прежнему предметному декодированию", () => {
  const buffers = typedSnapshot([richYamlUpdate("cf/source.yaml", "cf", "Catalog.Source")])
  const snapshot = new ProjectStateSnapshotView(buffers)
  vi.spyOn(snapshot, "decodeFacts").mockImplementation(() => { throw new Error("старый декодер вызван") })
  const queryPort = createBinaryProjectStateQueryPort(snapshot)

  queryPort.resolveTargets([
    lookup("first", "cf", "Catalog.Source"),
    lookup("second", "cf", "Catalog.Source"),
  ])

  expect(queryPort.readValidationStatus({ offset: 0, batchSize: 1 })).toHaveLength(1)
})

function openSessionWithUpdates(updates: ReturnType<typeof richYamlUpdate>[]) {
  const buffers = typedSnapshot(updates)
  return openBinaryProjectStateReadSession(createBinaryProjectStateReadToken(buffers))
}

function typedSnapshot(updates: ReturnType<typeof richYamlUpdate>[]) {
  const writer = createProjectStateFragmentWriter()
  updates.forEach((update, index) => writer.appendFile(update, BigInt(index + 1)))
  return buildProjectStateSnapshot({ fragments: [openProjectStateFragment(writer.finish())], deletions: [] })
}

function lookup(
  requestId: string,
  componentPath: string,
  canonicalTarget: string,
): ProjectTargetLookup {
  return { requestId, componentPath, canonicalTarget }
}
