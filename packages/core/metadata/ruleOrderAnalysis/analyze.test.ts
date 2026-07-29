import { describe, expect, it } from "vitest"
import type { LayeredImportReferenceSnapshot } from "../importFromXml/componentReferenceIndex"
import type { XmlImportWorkerPoolHandle } from "../importFromXml/workerPool"
import { analyzeRuleOrder, type RuleOrderAnalyzerDependencies } from "./analyze"

const metadataDir = import.meta.dirname

describe("analyzeRuleOrder inputs", () => {
  it("processes cf before cfe and passes the cf/all snapshot as extension base", async () => {
    const initialized: Array<{ componentKind: string; metadataItemAugmenter?: string }> = []
    const labels: string[] = []
    const references: LayeredImportReferenceSnapshot[] = []
    const dependencies = fakeDependencies({ initialized, labels, references })

    const result = await analyzeRuleOrder(
      {
        xmlRoot: "/xml/cf",
        extensionRoot: "/xml/cfe",
        extensionBase: "all",
        metadataDir,
      },
      dependencies
    )

    expect(result.configurations).toEqual(["cf/all", "cf/small", "cfe/control", "cfe/default"])
    expect(initialized).toEqual([
      { componentKind: "configuration" },
      { componentKind: "configuration" },
      {
        componentKind: "configurationExtension",
        metadataItemAugmenter: "configurationExtension",
      },
      {
        componentKind: "configurationExtension",
        metadataItemAugmenter: "configurationExtension",
      },
    ])
    expect(labels).toEqual(result.configurations)
    expect(result.configurationStats).toMatchObject([
      { sourceKind: "configuration", configuration: "cf/all" },
      { sourceKind: "configuration", configuration: "cf/small" },
      {
        sourceKind: "configurationExtension",
        configuration: "cfe/control",
        baseConfiguration: "cf/all",
      },
      {
        sourceKind: "configurationExtension",
        configuration: "cfe/default",
        baseConfiguration: "cf/all",
      },
    ])
    expect(references[2]?.base).toBe(references[0]?.local)
    expect(references[3]?.base).toBe(references[0]?.local)
  })

  it("rejects an extension base absent from cf", async () => {
    await expect(
      analyzeRuleOrder(
        {
          xmlRoot: "/xml/cf",
          extensionRoot: "/xml/cfe",
          extensionBase: "missing",
          metadataDir,
        },
        fakeDependencies()
      )
    ).rejects.toThrow("Не найдена базовая конфигурация cf/missing")
  })

  it("обрабатывает только выбранную конфигурацию и её расширения", async () => {
    const result = await analyzeRuleOrder(
      {
        xmlRoot: "/xml/cf",
        configuration: "all",
        extensionRoot: "/xml/cfe",
        extensionBase: "all",
        metadataDir,
      },
      fakeDependencies()
    )

    expect(result.configurations).toEqual(["cf/all", "cfe/control", "cfe/default"])
  })

  it("rejects a component kind that does not match its source root", async () => {
    const dependencies = fakeDependencies()
    dependencies.resolveComponent = () => ({ kind: "configurationExtension" })

    await expect(
      analyzeRuleOrder({ xmlRoot: "/xml/cf", metadataDir }, dependencies)
    ).rejects.toThrow("ожидался XML-компонент configuration")
  })
})

function fakeDependencies(captures: {
  initialized?: Array<{ componentKind: string; metadataItemAugmenter?: string }>
  labels?: string[]
  references?: LayeredImportReferenceSnapshot[]
} = {}): RuleOrderAnalyzerDependencies {
  let operationIndex = 0
  return {
    async listDirectories(root) {
      return root === "/xml/cf" ? ["all", "small"] : ["control", "default"]
    },
    async readComponentRoot(xmlDir) {
      return { extension: xmlDir.includes("/cfe/") }
    },
    resolveComponent(root) {
      return root.extension === true
        ? {
            kind: "configurationExtension",
            metadataItemAugmenter: "configurationExtension",
          }
        : { kind: "configuration" }
    },
    async discover(xmlDir) {
      const name = xmlDir.split("/").at(-1) ?? ""
      return {
        assignments: [
          {
            id: name,
            role: "properties",
            targetProjectPath: `Справочник/${name}/Свойства.yaml`,
            itemType: "MetadataCatalog",
            itemName: name,
            logicalAddress: `Справочник.${name}`,
            owner: undefined,
            xmlFiles: [{ role: "metadata", sourcePath: `${xmlDir}/Catalogs/${name}.xml` }],
            externalFiles: [],
          },
        ],
      }
    },
    createWorkerPoolHandle() {
      return {
        createOperationPool() {
          operationIndex += 1
          return {
            async initialize(params) {
              captures.initialized?.push({
                componentKind: params.componentKind,
                ...(params.metadataItemAugmenter === undefined
                  ? {}
                  : { metadataItemAugmenter: params.metadataItemAugmenter }),
              })
            },
            async runFirstPass() {
              throw new Error("Обычный первый проход не ожидался")
            },
            async runRuleOrderAnalysisFirstPass(params) {
              captures.labels?.push(params.configuration)
              return {
                diagnostics: [],
                ownerFacts: [],
                validationContribution: emptyValidationContribution(),
                localDependencies: [],
                fragmentData: {
                  identities: [],
                  xmlNodes: [],
                  xmlValues: [],
                  localDependencies: [],
                },
                observations: [],
                unmatchedObservationCount: 0,
                unmatchedItemTypes: [],
              }
            },
            async runSecondPass(referenceSnapshots) {
              captures.references?.push(referenceSnapshots)
              return { diagnostics: [], warnings: [], files: [] }
            },
            async close() {},
          }
        },
        async close() {},
        size() {
          return operationIndex
        },
      } satisfies XmlImportWorkerPoolHandle
    },
  }
}

function emptyValidationContribution() {
  return {
    objectRecords: [],
    objectIndexEntries: [],
    memberIndexEntries: [],
    valueIndexEntries: [],
    pendingReferences: [],
    localDependencies: [],
    logicalAddresses: [],
  }
}
