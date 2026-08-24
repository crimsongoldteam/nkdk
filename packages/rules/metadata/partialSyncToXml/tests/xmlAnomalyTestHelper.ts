import { hashFileBytes } from "@nkdk/runtime"
import {
  createRuleRegistrySet,
  withPropertyRuleRegistrySet,
  withRuleRegistrySet,
  type MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import {
  createFullXmlSyncDiagnosticCollectionFromDiagnostics,
  createFullXmlSyncFileCollectionFromFiles,
  type FullXmlSyncWorkerInitialization,
  type FullXmlSyncWorkerPool,
} from "../../fullSyncToXml/workerPool"
import { executeFullXmlSyncAssignmentCore } from "../../fullSyncToXml/worker"
import type {
  FullXmlSyncAssignment,
  FullXmlSyncDiagnostic,
  FullXmlSyncExpectedOutput,
  FullXmlSyncWrittenFile,
} from "../../fullSyncToXml/types"
import type { PreparedPartialXmlSyncPackageParams } from "../preparePartialXmlSyncPackage"
import { mockContextToXML } from "../../../tests/mockContext"
import { testConfigurationIndexReader } from "../../../tests/configurationIndex"
import { createTestProjectStateReadToken } from "../../projectState/tests/readToken"
import { compileMetadataResourceTopology } from "../../resourceTopology/core/compiler"
import { defineMetadataXmlPrepareCapability } from "../../resourceTopology/adapters/capabilities"
import { composeMetadataRules } from "../../ruleRuntime/definition"
import { metadataRules } from "../../composition/metadataRules"
import { createOperationRegistrySet } from "../../operations/operationRegistrySet"
import { withOperationRegistrySet } from "../../operations/operationExecutionContext"

const sourceProjectPath = "Объект/Один/Свойства.yaml"
const sourceBytes = new TextEncoder().encode([
  "Значение: !xml/raw",
  "  $значение: ordinary",
  '  $xml: { "#text": "01" }',
  "",
].join("\n"))
const rootRule = {
  itemType: "PartialXmlAnomalyTestOwner",
  properties: {
    value: { type: "string", yaml: "Значение", xml: "Value" },
  },
  metadataTargetOwner: { kind: "self", root: "Catalog" },
} as const satisfies MetadataItemRule

export function createPartialXmlAnomalyExecutionFixture(projectDir: string) {
  const componentDir = `${projectDir}/cf`
  const source = { kind: "itemRule" as const, description: "partial anomaly test" }
  const topology = compileMetadataResourceTopology([{
    dir: "Объект",
    kind: "test",
    rule: rootRule,
    exportSchema: () => ({}) as never,
    resources: [
      {
        kind: "content",
        projectPattern: "Объект/{ownerName}/Свойства.yaml",
        role: "properties",
        required: true,
        repeatable: true,
        compositionImpact: "configurationComposition",
        itemRule: rootRule,
        source,
      },
      {
        kind: "xmlDocument",
        assignmentProjectPattern: "",
        xmlPattern: "Objects/{ownerName}.xml",
        role: "metadata",
        required: true,
        prepareCapabilityId: "partial-anomaly-test",
        source,
      },
    ],
  }])
  const node = topology.assignments[0]!
  const operations = createOperationRegistrySet(composeMetadataRules(
    metadataRules,
    defineMetadataXmlPrepareCapability({
      id: "partial-anomaly-test",
      run: ({ outputs }) => outputs.map((output) => ({
        declarationId: output.declarationId,
        targetXmlPath: output.targetXmlPath,
        xml: { Root: { Value: "ordinary" } },
        deferred: [],
        rootRule,
      })),
    }),
  ))
  const registries = createRuleRegistrySet(metadataRules)
  const assignment: FullXmlSyncAssignment = {
    id: sourceProjectPath,
    sourceProjectPath,
    sourcePath: `${componentDir}/${sourceProjectPath}`,
    expectedContentHash: hashFileBytes(sourceBytes),
    role: "properties",
    itemType: rootRule.itemType,
    itemName: "Один",
    logicalAddress: "Объект.Один",
    nodeId: node.id,
    potentialOutputs: node.xmlDocuments.map((document) => ({
      declarationId: document.id,
      targetXmlPath: document.xmlPattern.replace("{ownerName}", "Один"),
      role: document.role,
      required: document.required,
      prepareCapabilityId: document.prepareCapabilityId!,
    })),
  }
  const declarationId = assignment.potentialOutputs[0]!.declarationId
  const targetXmlPath = assignment.potentialOutputs[0]!.targetXmlPath
  const context = mockContextToXML()
  const stage = {
    context,
    projectDir,
    componentPath: "cf",
    projectState: {
      workers: {
        async beginOperation() { return {} as never },
      },
    },
    readToken: createTestProjectStateReadToken(),
    diagnostics: [],
    runtime: {
      target: {
        structure: { componentDir },
        snapshot: { descriptor: testIndexDescriptor(projectDir) },
        indexes: { logicalAddresses: [] },
      },
      workerProfile: { kind: "configuration", componentKind: "configuration", adoptedUuids: {} },
    },
    plan: { assignments: [assignment], externalFiles: [] },
    compositionAssignments: [assignment],
    impact: {
      assignmentDocumentIds: new Map([[assignment.id, new Set([declarationId])]]),
      loadTargets: [targetXmlPath],
    },
    migration: { referencePathByCurrentPath: {}, candidateAppliedNames: [], pending: [] },
    changes: { added: [], changed: [], deleted: [] },
  } as unknown as PreparedPartialXmlSyncPackageParams

  return {
    assignment,
    declarationId,
    targetXmlPath,
    stage,
    createWorkerPool: () => inProcessWorkerPool(
      assignment,
      sourceBytes,
      componentDir,
      topology,
      operations,
      registries,
    ),
  }
}

function inProcessWorkerPool(
  assignment: FullXmlSyncAssignment,
  yamlBytes: Uint8Array,
  componentDir: string,
  topology: ReturnType<typeof compileMetadataResourceTopology>,
  operations: ReturnType<typeof createOperationRegistrySet>,
  registries: ReturnType<typeof createRuleRegistrySet>,
): FullXmlSyncWorkerPool {
  let initialization: FullXmlSyncWorkerInitialization | undefined
  return {
    async initialize(value) { initialization = value },
    async execute(assignments, options) {
      if (initialization === undefined) throw new Error("Test full-sync worker pool не инициализирован")
      const initialized = initialization
      const diagnostics: FullXmlSyncDiagnostic[] = []
      const warnings: FullXmlSyncDiagnostic[] = []
      const writtenFiles: FullXmlSyncWrittenFile[] = []
      const expectedOutputs: FullXmlSyncExpectedOutput[] = []
      for (const requested of assignments) {
        if (requested.id !== assignment.id) throw new Error(`Неизвестный assignment: ${requested.id}`)
        const result = await withPropertyRuleRegistrySet(registries.property, () =>
          withRuleRegistrySet(registries, () =>
            withOperationRegistrySet(operations, () => executeFullXmlSyncAssignmentCore({
              assignment,
              sourceBytes: yamlBytes,
              descriptor: {
                componentPath: "cf",
                componentDir,
                rootProjectPath: `cf/${assignment.sourceProjectPath}`,
                projectPath: assignment.sourceProjectPath,
                filePath: assignment.sourcePath,
                role: assignment.role,
                owner: { dir: "Объект", name: assignment.itemName },
                itemType: assignment.itemType,
              },
              itemTypeByYamlDir: { Объект: rootRule.itemType },
              context: mockContextToXML(),
              index: testConfigurationIndexReader(),
              composition: { children: () => [] },
              operationSeed: initialized.operationSeed ?? new Uint8Array(32),
              topology,
              outputTarget: initialized.outputTarget,
            })),
          ),
        )
        diagnostics.push(...result.diagnostics)
        warnings.push(...result.warnings)
        writtenFiles.push(...result.writtenFiles)
        expectedOutputs.push(...result.expectedOutputs)
        await options?.onBatch?.({
          generatedDocuments: result.generatedDocuments,
          configurationFragments: result.fragments,
        })
      }
      return {
        diagnostics: createFullXmlSyncDiagnosticCollectionFromDiagnostics(diagnostics),
        warnings: createFullXmlSyncDiagnosticCollectionFromDiagnostics(warnings),
        writtenFiles: createFullXmlSyncFileCollectionFromFiles(writtenFiles),
        expectedOutputs: createFullXmlSyncFileCollectionFromFiles(expectedOutputs),
      }
    },
    async close() {},
  }
}

function testIndexDescriptor(projectDir: string) {
  return {
    dataPath: `${projectDir}/index.lmdb`,
    lockPath: `${projectDir}/index.lmdb-lock`,
    schemaVersion: 1 as const,
  }
}
