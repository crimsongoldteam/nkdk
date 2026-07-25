import type { PropertyRule } from "../orchestration/property/types"
import type { MetadataItemRule } from "../orchestration/property/types"
import { getTypeRule } from "../orchestration/property/typeRuleRegistry"
import { getRegisteredProjectSpecs, type RegisteredProjectSpec } from "../project/projectSpecRegistry"
import { compileMetadataResourceTopology } from "./compiler"
import { joinMetadataPathPatterns } from "./patterns"
import type { MetadataResourceDeclaration } from "./types"
import type { CompiledMetadataResourceTopology, MetadataResourceSource } from "./types"

export function describePropertyResourceTopology(
  propertyName: string,
  propertyRule: PropertyRule
): readonly MetadataResourceDeclaration[] {
  const declarations = getTypeRule(propertyRule.type, "resourceTopology")?.({ propertyRule }) ?? []
  return declarations.map((declaration) => ({
    ...declaration,
    source: {
      kind: "property",
      description: `${propertyName}:${propertyRule.type}`,
    },
  }))
}

export function compileRegisteredMetadataResourceTopology(): CompiledMetadataResourceTopology {
  return compileMetadataResourceTopology(
    getRegisteredProjectSpecs().map((spec) => ({
      ...spec,
      resources: describeProjectSpecResourceTopology(spec),
    }))
  )
}

export function describeProjectSpecResourceTopology(
  spec: RegisteredProjectSpec
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
        prepareCapabilityId: "metadataItem",
        source,
      }
    )
    collectRuleDeclarations(declarations, spec.rule, {
      projectBase: "",
      xmlBase: "",
      assignmentProjectPattern: "Конфигурация.yaml",
      currentNameParameter: "ownerName",
      nextNameIndex: 1,
    })
  } else if (typeof spec.rule.xmlDir === "string") {
    const projectBase = `${spec.dir}/{ownerName}`
    const xmlBase = `${spec.rule.xmlDir}/{ownerName}`
    collectSpecAssignment(declarations, spec.rule, {
      projectBase,
      xmlBase,
      role: "properties",
      currentNameParameter: "ownerName",
    })
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
          role: "fileItem",
          currentNameParameter: `recursiveItemName${depth}`,
          ownerProjectPattern:
            depth === 1
              ? `${projectBase}/Свойства.yaml`
              : `${[projectBase, ...recursiveSteps.slice(0, -1)].join("/")}/Свойства.yaml`,
          logicalAddressSegment: spec.nesting.itemRole,
        })
      }
    }
  }

  declarations.push(...(spec.resources ?? []))
  for (const route of spec.xmlImportRoutes ?? []) {
    if (route.kind !== "ignore") continue
    declarations.push({
      kind: "ignore",
      side: "xml",
      pattern: route.xmlPattern,
      source,
    })
  }
  return declarations
}

function collectSpecAssignment(
  declarations: MetadataResourceDeclaration[],
  rule: MetadataItemRule,
  params: {
    projectBase: string
    xmlBase: string
    role: "properties" | "fileItem"
    currentNameParameter: string
    ownerProjectPattern?: string
    logicalAddressSegment?: string
  }
): void {
  const assignmentProjectPattern = `${params.projectBase}/Свойства.yaml`
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
      prepareCapabilityId: "metadataItem",
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
  })
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
  context: RuleTopologyContext
): void {
  for (const [propertyName, propertyRule] of Object.entries(rule.properties)) {
    const contribution = describePropertyResourceTopology(propertyName, propertyRule)
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
        })
        continue
      }
      if (declaration.kind === "xmlDocument") {
        target.push({
          ...declaration,
          assignmentProjectPattern:
            declaration.assignmentProjectPattern === ""
              ? contributionAssignment
              : joinMetadataPathPatterns(
                  context.projectBase,
                  substituteLocalParameters(declaration.assignmentProjectPattern, context)
                ),
          xmlPattern: joinWithOverlap(
            context.xmlBase,
            substituteLocalParameters(declaration.xmlPattern, context)
          ),
        })
        continue
      }
      if (declaration.kind === "externalFile") {
        target.push({
          ...declaration,
          assignmentProjectPattern:
            declaration.assignmentProjectPattern === ""
              ? contributionAssignment
              : joinMetadataPathPatterns(
                  context.projectBase,
                  substituteLocalParameters(declaration.assignmentProjectPattern, context)
                ),
          projectPattern: joinMetadataPathPatterns(
            context.projectBase,
            substituteLocalParameters(declaration.projectPattern, context)
          ),
          xmlPattern: joinWithOverlap(
            context.xmlBase,
            substituteLocalParameters(declaration.xmlPattern, context)
          ),
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
          prepareCapabilityId: "metadataItem",
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
      })
      continue
    }

    collectRuleDeclarations(target, collection.itemRule, {
      ...context,
      currentNameParameter: childNameParameter,
      parentNameParameter: context.currentNameParameter,
      nextNameIndex: context.nextNameIndex + 1,
    })
  }
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
