import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { PropertyRuleRegistrySet } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { RegisteredProjectSpec } from "../../projectDefinition/projectSpecContracts"
import { compileMetadataResourceTopology } from "../core/compiler"
import { joinMetadataPathPatterns } from "../core/patterns"
import type { MetadataResourceDeclaration } from "../core/types"
import type { CompiledMetadataResourceTopology, MetadataResourceSource } from "../core/types"

export function describePropertyResourceTopology(
  propertyName: string,
  propertyRule: PropertyRule,
  propertyRules: Pick<PropertyRuleRegistrySet, "getTypeRule"> = { getTypeRule },
): readonly MetadataResourceDeclaration[] {
  const declarations = propertyRules.getTypeRule(propertyRule.type, "resourceTopology")?.({ propertyRule }) ?? []
  return declarations.map((declaration) => ({
    ...declaration,
    source: {
      kind: "property",
      description: `${propertyName}:${propertyRule.type}`,
      propertyName,
      propertyType: propertyRule.type,
    },
  }))
}

export function compileMetadataResourceTopologyForProjectSpecs(
  projectSpecs: readonly RegisteredProjectSpec[],
  propertyRules?: Pick<PropertyRuleRegistrySet, "getTypeRule">,
): CompiledMetadataResourceTopology {
  return compileMetadataResourceTopology(
    projectSpecs.map((spec) => ({
      ...spec,
      resources: describeProjectSpecResourceTopology(spec, propertyRules),
    }))
  )
}

export function compileMetadataResourceTopologyForRootRule(
  rootRule: MetadataItemRule,
  projectSpecs: readonly RegisteredProjectSpec[],
  propertyRules?: Pick<PropertyRuleRegistrySet, "getTypeRule">,
): CompiledMetadataResourceTopology {
  return compileMetadataResourceTopologyForProjectSpecs(
    projectSpecs.map((spec) => (spec.dir === "" ? { ...spec, rule: rootRule } : spec)),
    propertyRules,
  )
}

export function describeProjectSpecResourceTopology(
  spec: RegisteredProjectSpec,
  propertyRules?: Pick<PropertyRuleRegistrySet, "getTypeRule">,
): readonly MetadataResourceDeclaration[] {
  const source = itemRuleSource(spec.rule)
  const declarations: MetadataResourceDeclaration[] = []

  if (spec.dir === "") {
    declarations.push(
      contentDeclaration({
        projectPattern: "Конфигурация.yaml",
        role: "configuration",
        itemRule: spec.rule,
        source,
      }),
      {
        kind: "xmlDocument",
        assignmentProjectPattern: "",
        xmlPattern: "Configuration.xml",
        role: "metadata",
        required: true,
        read: { inputRole: "metadata" },
        prepareCapabilityId: "configuration",
        source,
      }
    )
    collectRuleDeclarations(declarations, spec.rule, {
      projectBase: "",
      xmlBase: "",
      assignmentProjectPattern: "Конфигурация.yaml",
      currentNameParameter: "ownerName",
      nextNameIndex: 1,
    }, propertyRules)
  } else if (typeof spec.rule.xmlDir === "string") {
    const flatFile = spec.projectLayout === "flatFile"
    const projectBase = flatFile ? spec.dir : `${spec.dir}/{ownerName}`
    const xmlBase = `${spec.rule.xmlDir}/{ownerName}`
    collectSpecAssignment(declarations, spec.rule, {
      projectBase,
      xmlBase,
      assignmentProjectPattern: flatFile ? `${spec.dir}/{ownerName}.yaml` : undefined,
      role: "properties",
      currentNameParameter: "ownerName",
    }, propertyRules)
    if (spec.nesting?.kind === "recursiveChildDir") {
      for (let depth = 1; depth <= 16; depth += 1) {
        const recursiveSteps = Array.from(
          { length: depth },
          (_, index) => `${spec.nesting!.childDir}/{recursiveItemName${index + 1}}`
        )
        const recursiveXmlSteps = Array.from(
          { length: depth },
          (_, index) => `${spec.rule.xmlDir}/{recursiveItemName${index + 1}}`
        )
        const nestedProjectBase = [projectBase, ...recursiveSteps].join("/")
        collectSpecAssignment(declarations, spec.rule, {
          projectBase: nestedProjectBase,
          xmlBase: [xmlBase, ...recursiveXmlSteps].join("/"),
          role: "properties",
          currentNameParameter: `recursiveItemName${depth}`,
          ownerProjectPattern:
            depth === 1
              ? `${projectBase}/Свойства.yaml`
              : `${[projectBase, ...recursiveSteps.slice(0, -1)].join("/")}/Свойства.yaml`,
          logicalAddressSegment: spec.nesting.logicalAddressSegment,
        }, propertyRules)
      }
    }
  }

  declarations.push(...(spec.resources ?? []))
  if (spec.projectLayout === "flatFile") assertFlatFileProjectResources(spec, declarations)
  return declarations
}

function assertFlatFileProjectResources(
  spec: RegisteredProjectSpec,
  declarations: readonly MetadataResourceDeclaration[],
): void {
  const contentCount = declarations.filter((declaration) => declaration.kind === "content").length
  const hasAdditionalProjectResource = declarations.some(
    (declaration) =>
      declaration.kind === "yamlCompanion" ||
      declaration.kind === "externalFile" ||
      (declaration.kind === "childCollection" && containsProjectResource(declaration.declarations)),
  )
  if (contentCount !== 1 || hasAdditionalProjectResource) {
    throw new Error(`Плоское размещение ${spec.dir} не допускает дополнительные проектные ресурсы`)
  }
}

function containsProjectResource(declarations: readonly MetadataResourceDeclaration[]): boolean {
  return declarations.some(
    (declaration) =>
      declaration.kind === "content" ||
      declaration.kind === "yamlCompanion" ||
      declaration.kind === "externalFile" ||
      (declaration.kind === "childCollection" && containsProjectResource(declaration.declarations)),
  )
}

function collectSpecAssignment(
  declarations: MetadataResourceDeclaration[],
  rule: MetadataItemRule,
  params: {
    projectBase: string
    xmlBase: string
    assignmentProjectPattern?: string
    role: "properties" | "fileItem"
    currentNameParameter: string
    ownerProjectPattern?: string
    logicalAddressSegment?: string
  },
  propertyRules?: Pick<PropertyRuleRegistrySet, "getTypeRule">,
): void {
  const assignmentProjectPattern = params.assignmentProjectPattern ?? `${params.projectBase}/Свойства.yaml`
  declarations.push(
    contentDeclaration({
      projectPattern: assignmentProjectPattern,
      role: params.role,
      itemRule: rule,
      source: itemRuleSource(rule),
      compositionImpact: "configurationComposition",
      ownerProjectPattern: params.ownerProjectPattern,
      logicalAddressSegment: params.logicalAddressSegment,
    }),
    {
      kind: "xmlDocument",
      assignmentProjectPattern,
      xmlPattern: `${params.xmlBase}.xml`,
      role: "metadata",
      required: true,
      read: { inputRole: "metadata" },
      prepareCapabilityId: "appliedObject",
      source: itemRuleSource(rule),
    }
  )
  collectRuleDeclarations(declarations, rule, {
    projectBase: params.projectBase,
    xmlBase: params.xmlBase,
    assignmentProjectPattern,
    ownerProjectPattern: params.ownerProjectPattern,
    currentNameParameter: params.currentNameParameter,
    nextNameIndex: 1,
  }, propertyRules)
}

interface RuleTopologyContext {
  readonly projectBase: string
  readonly xmlBase: string
  readonly assignmentProjectPattern: string
  readonly ownerProjectPattern?: string
  readonly currentNameParameter: string
  readonly parentNameParameter?: string
  readonly nextNameIndex: number
}

function collectRuleDeclarations(
  target: MetadataResourceDeclaration[],
  rule: MetadataItemRule,
  context: RuleTopologyContext,
  propertyRules?: Pick<PropertyRuleRegistrySet, "getTypeRule">,
): void {
  for (const [propertyName, propertyRule] of Object.entries(rule.properties)) {
    const contribution = describePropertyResourceTopology(propertyName, propertyRule, propertyRules)
    let contributionAssignment = context.assignmentProjectPattern
    for (const declaration of contribution) {
      if (declaration.kind === "content") {
        const projectPattern = joinMetadataPathPatterns(
          context.projectBase,
          substituteLocalParameters(declaration.projectPattern, context)
        )
        contributionAssignment = projectPattern
        target.push({
          ...declaration,
          projectPattern,
          ownerProjectPattern: context.assignmentProjectPattern,
          fileBackedTarget: projectFileBackedTargetDeclaration(declaration.fileBackedTarget, context),
        })
        continue
      }
      if (declaration.kind === "yamlCompanion") {
        target.push({
          ...declaration,
          assignmentProjectPattern: resolveContributionAssignmentPattern(
            declaration.assignmentProjectPattern,
            contributionAssignment,
            context,
          ),
          projectPattern: joinMetadataPathPatterns(
            context.projectBase,
            substituteLocalParameters(declaration.projectPattern, context)
          ),
        })
        continue
      }
      if (declaration.kind === "xmlDocument") {
        target.push({
          ...declaration,
          assignmentProjectPattern: resolveContributionAssignmentPattern(
            declaration.assignmentProjectPattern,
            contributionAssignment,
            context,
          ),
          xmlPattern: joinWithOverlap(context.xmlBase, substituteLocalParameters(declaration.xmlPattern, context)),
        })
        continue
      }
      if (declaration.kind === "externalFile") {
        target.push({
          ...declaration,
          assignmentProjectPattern: resolveContributionAssignmentPattern(
            declaration.assignmentProjectPattern,
            contributionAssignment,
            context,
          ),
          projectPattern: joinMetadataPathPatterns(
            context.projectBase,
            substituteLocalParameters(declaration.projectPattern, context)
          ),
          xmlPattern: joinWithOverlap(context.xmlBase, substituteLocalParameters(declaration.xmlPattern, context)),
          fileBackedTarget: projectFileBackedTargetDeclaration(declaration.fileBackedTarget, context),
          ...(declaration.selection === undefined
            ? {}
            : {
                selection: {
                  ...declaration.selection,
                  manifestPattern: joinWithOverlap(
                    context.xmlBase,
                    substituteLocalParameters(declaration.selection.manifestPattern, context)
                  ),
                },
              }),
        })
        continue
      }
      if (declaration.kind === "ignore") {
        target.push({
          ...declaration,
          pattern:
            declaration.side === "project"
              ? joinMetadataPathPatterns(context.projectBase, substituteLocalParameters(declaration.pattern, context))
              : joinWithOverlap(context.xmlBase, substituteLocalParameters(declaration.pattern, context)),
        })
      }
    }
  }

  for (const collection of rule.childCollections ?? []) {
    const childNameParameter = nameParameter(context.nextNameIndex)
    if (collection.fileItemRule && collection.xmlDir && collection.nkdkDir) {
      const childProjectBase = joinMetadataPathPatterns(
        context.projectBase,
        pathValueToPattern(collection.nkdkDir, childNameParameter, context.currentNameParameter)
      )
      const childXmlBase = joinWithOverlap(
        context.xmlBase,
        pathValueToPattern(collection.xmlDir, childNameParameter, context.currentNameParameter)
      )
      const assignmentProjectPattern = `${childProjectBase}/Свойства.yaml`
      target.push(
        contentDeclaration({
          projectPattern: assignmentProjectPattern,
          role: "fileItem",
          itemRule: collection.fileItemRule,
          source: itemRuleSource(collection.fileItemRule),
          ownerProjectPattern: context.assignmentProjectPattern,
          logicalAddressSegment: collection.configurationIndexUidSegment,
        }),
        {
          kind: "xmlDocument",
          assignmentProjectPattern,
          xmlPattern: `${childXmlBase}.xml`,
          role: "metadata",
          required: true,
          read: { inputRole: "metadata" },
          prepareCapabilityId: "appliedObject",
          source: itemRuleSource(collection.fileItemRule),
        }
      )
      collectRuleDeclarations(target, collection.itemRule, {
        projectBase: childProjectBase,
        xmlBase: childXmlBase,
        assignmentProjectPattern,
        ownerProjectPattern: context.assignmentProjectPattern,
        currentNameParameter: childNameParameter,
        parentNameParameter: context.currentNameParameter,
        nextNameIndex: context.nextNameIndex + 1,
      }, propertyRules)
      continue
    }

    collectRuleDeclarations(target, collection.itemRule, {
      ...context,
      currentNameParameter: childNameParameter,
      parentNameParameter: context.currentNameParameter,
      nextNameIndex: context.nextNameIndex + 1,
    }, propertyRules)
  }
}

function resolveContributionAssignmentPattern(
  declarationPattern: string,
  contributionAssignment: string,
  context: RuleTopologyContext,
): string {
  return declarationPattern === ""
    ? contributionAssignment
    : joinMetadataPathPatterns(
        context.projectBase,
        substituteLocalParameters(declarationPattern, context),
      )
}

function projectFileBackedTargetDeclaration(
  declaration: Extract<MetadataResourceDeclaration, { kind: "content" | "externalFile" }>["fileBackedTarget"],
  context: RuleTopologyContext
) {
  return declaration === undefined
    ? undefined
    : {
        ...declaration,
        itemNameParameter: substituteLocalParameterName(declaration.itemNameParameter, context),
        itemProjectPattern: joinMetadataPathPatterns(
          context.projectBase,
          substituteLocalParameters(declaration.itemProjectPattern, context)
        ),
      }
}

function substituteLocalParameterName(parameter: string, context: RuleTopologyContext): string {
  return substituteLocalParameters(`{${parameter}}`, context).slice(1, -1)
}

function contentDeclaration(params: {
  projectPattern: string
  role: "configuration" | "properties" | "fileItem"
  itemRule: MetadataItemRule
  source: MetadataResourceSource
  compositionImpact?: "none" | "configurationComposition"
  ownerProjectPattern?: string
  logicalAddressSegment?: string
}): MetadataResourceDeclaration {
  return {
    kind: "content",
    projectPattern: params.projectPattern,
    role: params.role,
    required: true,
    repeatable: params.role !== "configuration",
    compositionImpact: params.compositionImpact ?? "none",
    itemRule: params.itemRule,
    ...(params.ownerProjectPattern === undefined ? {} : { ownerProjectPattern: params.ownerProjectPattern }),
    ...(params.logicalAddressSegment === undefined ? {} : { logicalAddressSegment: params.logicalAddressSegment }),
    source: params.source,
  }
}

function substituteLocalParameters(pattern: string, context: RuleTopologyContext): string {
  return pattern.replace(/\{(ownerName|itemName|currentName|parentName)(\.\.\.)?\}/g, (_placeholder, key, rest) => {
    const parameter =
      key === "itemName"
        ? nameParameter(context.nextNameIndex)
        : key === "parentName"
          ? (context.parentNameParameter ?? context.currentNameParameter)
          : context.currentNameParameter
    return `{${parameter}${rest ?? ""}}`
  })
}

function pathValueToPattern(
  value: string | ((params: { name: string; parentName?: string }) => string),
  nameKey: string,
  parentNameKey: string
): string {
  if (typeof value === "string") return value
  const nameSentinel = "__NKDK_RESOURCE_NAME__"
  const parentSentinel = "__NKDK_RESOURCE_PARENT__"
  return value({ name: nameSentinel, parentName: parentSentinel })
    .split(nameSentinel)
    .join(`{${nameKey}}`)
    .split(parentSentinel)
    .join(`{${parentNameKey}}`)
}

function joinWithOverlap(base: string, tail: string): string {
  const baseParts = base.split("/").filter(Boolean)
  const tailParts = tail.split("/").filter(Boolean)
  for (let overlap = Math.min(baseParts.length, tailParts.length); overlap > 0; overlap -= 1) {
    if (baseParts.slice(-overlap).every((part, index) => part === tailParts[index])) {
      return [...baseParts, ...tailParts.slice(overlap)].join("/")
    }
  }
  return [...baseParts, ...tailParts].join("/")
}

function nameParameter(index: number): string {
  return index === 1 ? "itemName" : `itemName${index}`
}

function itemRuleSource(rule: MetadataItemRule): MetadataResourceSource {
  return { kind: "itemRule", description: rule.itemType }
}
