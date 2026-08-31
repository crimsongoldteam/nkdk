import type {
  ConfigurationIndexBlockFragment,
  ConfigurationIndexCollector,
  ExternalFileEntry,
  XmlDocument,
  XmlImportConfigurationContext,
} from "@nkdk/runtime"
import type { DirectImportFactsSink, LocalIndexes, MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { importClientApplicationFormFromXMLToYAML } from "../forms/clientApplicationForm/fromXMLToYAML"
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
  const facts: DirectImportFactsSink = {
    acceptProperty(fact) {
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
  }
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
