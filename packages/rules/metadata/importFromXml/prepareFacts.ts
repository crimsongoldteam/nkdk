import type {
  ConfigurationIndexBlockFragment,
  ConfigurationIndexCollector,
  ExternalFileEntry,
  XmlDocument,
  XmlImportConfigurationContext,
} from "@nkdk/runtime"
import { yamlPathToPointer } from "@nkdk/runtime"
import type { DirectImportFactsSink, LocalIndexes, MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { importClientApplicationFormFromXMLToYAML } from "../forms/clientApplicationForm/fromXMLToYAML"
import {
  createImportedFormDataPathIndex,
  importedClientApplicationForm,
} from "../forms/clientApplicationForm/formDataPathMetadata"
import { resolveClientApplicationFormCollectionItemRule } from "../forms/clientApplicationForm/formDataPathProjection"
import { ClientApplicationFormRules } from "../forms/clientApplicationForm/rules"
import type { ClientApplicationFormXML, FormMetadataXML } from "../forms/clientApplicationForm/types"
import { importMetadataItemFromXMLToYAML } from "../ruleRuntime/metadataItem/fromXMLToYAML"
import { createImportedDependentPropertyCollector } from "@nkdk/runtime/rule-kit"
import { createLocalIndexesCollector } from "../projectDefinition/localIndexes"
import type { CompiledMetadataResourceTopology } from "../resourceTopology/core/types"
import type { MetadataItemOwnerContextEntry } from "../ruleRuntime/appliedObject/metadataItemOwnerContext"
import type { ValidationProfiler } from "../validation/profile"
import { collectImportedDependentXmlValues } from "./dependentItems"
import type { PackedImportXmlInput } from "./packedXmlAssignment"
import {
  createResolvedAssignmentImportEnvironment,
  mapExternalPropertyXmlInputs,
  type ParsedImportXmlInput,
} from "./prepareYaml"
import type { ImportAssignment } from "./types"
import { collectFormDataPathOccurrencesFromYAML } from "../validation/dataPath/formYamlTraversal"
import { toDataPathPolicyInput } from "../validation/dataPath/policies"
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"

export interface PreparedImportFacts {
  readonly assignment: ImportAssignment
  readonly targetProjectPath: string
  readonly rule: MetadataItemRule
  readonly ownerContext: readonly MetadataItemOwnerContextEntry[]
  readonly dependentOwner: { readonly dir: string; readonly name: string }
  readonly localIndexes: LocalIndexes
  readonly configurationFragment: ConfigurationIndexBlockFragment
  readonly generatedFiles: readonly ExternalFileEntry[]
  readonly reconstructionFacts: {
    readonly rootPropertyValues: Readonly<Record<string, unknown>>
  }
  readonly formValidation?: {
    readonly index: NonNullable<LocalIndexes["metadata"]["formDataPathIndex"]>
    readonly owner: { readonly kind: string; readonly name: string }
    readonly pendingChecks: readonly ValidationPendingCheck[]
  }
}

type ParsedFactsXmlInput = Omit<ParsedImportXmlInput, "document"> & { readonly document: XmlDocument }

export async function prepareImportFacts(params: {
  readonly assignment: ImportAssignment
  readonly context: XmlImportConfigurationContext
  readonly collector: ConfigurationIndexCollector
  readonly inputs: readonly PackedImportXmlInput[]
  readonly topology?: CompiledMetadataResourceTopology
  readonly profiler?: ValidationProfiler
}): Promise<PreparedImportFacts> {
  const inputs = parsedInputs(params.inputs)
  const {
    generatedFiles,
    rule,
    ownerContext,
    importContext,
    dependentOwner,
  } = createResolvedAssignmentImportEnvironment({
    assignment: params.assignment,
    context: params.context,
    collector: params.collector,
    topology: params.topology,
  })
  const rootPropertyValues: Record<string, unknown> = {}
  const propertyFacts: Parameters<DirectImportFactsSink["acceptProperty"]>[0][] = []
  const facts: DirectImportFactsSink = {
    acceptProperty(fact) {
      propertyFacts.push({ ...fact, yamlPath: [...fact.yamlPath] })
      if (fact.yamlPath.length !== 1 || typeof fact.yamlPath[0] !== "string") return
      if (!isCompactFactValue(fact.value)) return
      rootPropertyValues[fact.yamlPath[0]] = fact.value
    },
  }

  const imported = measureFacts(params.profiler, () => {
    if (rule.itemType === ClientApplicationFormRules.itemType) {
      const metadata = requireInput(inputs, "metadata")
      const body = inputs.find(({ input }) => input.role === "body")
      return importClientApplicationFormFromXMLToYAML({
        context: importContext,
        formName: params.assignment.itemName,
        formXML: body?.parsed["Form"] as ClientApplicationFormXML | undefined,
        metadataXML: metadata.parsed["MetaDataObject"] as FormMetadataXML,
        formXMLNode: body?.document.roots.find(({ name }) => name === "Form"),
        metadataXMLNode: metadata.document.roots.find(({ name }) => name === "MetaDataObject"),
        rule,
        mode: "facts",
        facts,
      })
    }

    const localIndexesCollector = createLocalIndexesCollector()
    const dependent = createImportedDependentPropertyCollector()
    const metadata = requireInput(inputs, "metadata")
    const externalPropertyXml = mapExternalPropertyXmlInputs(rule, inputs)
    importMetadataItemFromXMLToYAML({
      context: importContext,
      rule,
      name: params.assignment.itemName,
      xml: metadata.document.roots.find(({ name }) => name === "MetaDataObject")
        ?? metadata.parsed["MetaDataObject"],
      traversal: {
        mode: "facts",
        facts,
        yamlPath: [],
        rulePath: [],
        collector: localIndexesCollector,
        dependent,
        xmlNodes: metadata.document.roots,
      },
      propertyXML: externalPropertyXml.compatibilityByPropertyKey,
      propertyXMLNodes: externalPropertyXml.nodesByPropertyKey,
    })
    collectImportedDependentXmlValues(dependent.finish(), params.collector)
    return {
      yaml: undefined,
      localIndexes: localIndexesCollector.finish(),
      deferred: [],
      generatedFiles: [],
    }
  })

  const formValidation = prepareFormValidationFacts({
    assignment: params.assignment,
    rule,
    localIndexes: imported.localIndexes,
    propertyFacts,
    owner: dependentOwner,
  })

  return {
    assignment: params.assignment,
    targetProjectPath: params.assignment.targetProjectPath,
    rule,
    ownerContext,
    dependentOwner,
    localIndexes: imported.localIndexes,
    configurationFragment: params.collector.fragment(params.assignment.targetProjectPath),
    generatedFiles: [...generatedFiles, ...imported.generatedFiles.filter((file) => !generatedFiles.includes(file))],
    reconstructionFacts: { rootPropertyValues },
    ...(formValidation === undefined ? {} : { formValidation }),
  }
}

function prepareFormValidationFacts(params: {
  readonly assignment: ImportAssignment
  readonly rule: MetadataItemRule
  readonly localIndexes: LocalIndexes
  readonly propertyFacts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly owner: { readonly dir: string; readonly name: string }
}): PreparedImportFacts["formValidation"] {
  const projection = projectAcceptedPropertyFacts(params.localIndexes, params.propertyFacts)
  const form = importedClientApplicationForm({ yaml: projection, rule: params.rule })
  if (form === undefined) return undefined
  const index = createImportedFormDataPathIndex({ yaml: projection, rule: params.rule })
  if (index === undefined) return undefined
  params.localIndexes.metadata.formDataPathIndex = index
  const pendingChecks: ValidationPendingCheck[] = collectFormDataPathOccurrencesFromYAML({
    yaml: form.yaml,
    rule: form.rule,
    resolveCollectionItemRule: ({ yaml, propertyRule }) =>
      resolveClientApplicationFormCollectionItemRule({ yaml, propertyRule }),
  }).map((occurrence) => ({
    kind: "dataPath",
    yamlPath: [...occurrence.yamlPath],
    location: {
      filePath: params.assignment.targetProjectPath,
      line: 1,
      col: 1,
      path: yamlPathToPointer(occurrence.yamlPath),
    },
    owner: { kind: params.owner.dir, name: params.owner.name },
    value: occurrence.value,
    index,
    policyInput: toDataPathPolicyInput(occurrence.rule),
    ...(occurrence.elementType === undefined ? {} : { elementType: occurrence.elementType }),
    ...(occurrence.hasValuesPicture === true ? { hasValuesPicture: true } : {}),
    ...(occurrence.tableContext === undefined ? {} : { tableContext: occurrence.tableContext }),
    policy: "formDataPath",
  }))
  return {
    index,
    owner: { kind: params.owner.dir, name: params.owner.name },
    pendingChecks,
  }
}

function projectAcceptedPropertyFacts(
  indexes: LocalIndexes,
  propertyFacts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][],
): Record<string, unknown> {
  const latestByKey = new Map<string, Parameters<DirectImportFactsSink["acceptProperty"]>[0]>()
  for (const fact of propertyFacts) latestByKey.set(propertyFactKey(fact.yamlPath, fact.propertyKey), fact)
  const result: Record<string, unknown> = {}
  for (const event of indexes.metadata.events) {
    if (event.kind !== "property") continue
    const propertyKey = event.rulePath.at(-1)?.propertyKey
    if (propertyKey === undefined) continue
    const fact = latestByKey.get(propertyFactKey(event.yamlPath, propertyKey))
    if (fact !== undefined) setValueAtPath(result, event.yamlPath, fact.value)
  }
  return result
}

function propertyFactKey(path: readonly (string | number)[], propertyKey: string): string {
  return JSON.stringify([path, propertyKey])
}

function setValueAtPath(root: Record<string, unknown>, path: readonly (string | number)[], value: unknown): void {
  if (path.length === 0) return
  let current: Record<string, unknown> | unknown[] = root
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index]!
    const nextSegment = path[index + 1]!
    const existing = childAt(current, segment)
    if (typeof existing === "object" && existing !== null) {
      current = existing as Record<string, unknown> | unknown[]
      continue
    }
    const created: Record<string, unknown> | unknown[] = typeof nextSegment === "number" ? [] : {}
    setChild(current, segment, created)
    current = created
  }
  setChild(current, path.at(-1)!, value)
}

function childAt(container: Record<string, unknown> | unknown[], segment: string | number): unknown {
  if (!Array.isArray(container)) return container[String(segment)]
  return typeof segment === "number" ? container[segment] : undefined
}

function setChild(
  container: Record<string, unknown> | unknown[],
  segment: string | number,
  value: unknown,
): void {
  if (!Array.isArray(container)) {
    container[String(segment)] = value
    return
  }
  if (typeof segment !== "number") throw new Error(`Строковый сегмент ${segment} внутри YAML-массива`)
  container[segment] = value
}

function parsedInputs(inputs: readonly PackedImportXmlInput[]): ParsedFactsXmlInput[] {
  return inputs.map(({ input, document }) => ({
    input,
    document,
    roots: document.roots,
    parsed: document.compatibility,
  }))
}

function requireInput(
  inputs: readonly ParsedFactsXmlInput[],
  role: PackedImportXmlInput["input"]["role"],
): ParsedFactsXmlInput {
  const input = inputs.find((candidate) => candidate.input.role === role)
  if (input === undefined) throw new Error(`В задании XML-import отсутствует ${role} XML`)
  return input
}

function isCompactFactValue(value: unknown): boolean {
  return value === null
    || typeof value === "string"
    || typeof value === "number"
    || typeof value === "boolean"
    || typeof value === "bigint"
}

function measureFacts<T>(profiler: ValidationProfiler | undefined, action: () => T): T {
  if (profiler === undefined) return action()
  return profiler.measure(
    "Подготовка импорта конфигурации",
    "Извлечение фактов XML",
    { items: 1 },
    action,
  )
}
