import fs from "fs"
import { dirname, join } from "path"
import { getChildContextToXML } from "@nkdk/runtime/rule-kit"
import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { convertMetadataItemFromYAMLToXML } from "../metadataItem/fromYAMLToXML"
import { convertPropertiesFromYAMLToXML } from "../property/fromYAMLToXML"
import { createYAMLPropertySource } from "../property/fromYAMLToXML"
import { getTypeRule } from "../property/typeRuleRegistry"
import type { FileChildNamesDescriptor } from "../property/fn"
import { metadataTargetOwnerFromRule } from "../property/metadataTargetString"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import { xmlExport } from "@nkdk/runtime"
import type { PreparedYamlFile } from "../../project/preparedYamlProject"
import { bindDeferredObjectValues, type DeferredObjectValue } from "../property/deferredObjectValues"
import { withYAMLImportDiagnostics } from "../yamlImportError"
import { getFileItemXMLRootContainer } from "./fileItemChildCollections"
import { registerMetadataXmlPrepareCapability } from "../../resourceTopology/adapters/capabilities"
import { withConfigurationIndexExportPropertyContext } from "@nkdk/runtime"
import type { MetadataXmlPrepareComposition } from "../../resourceTopology/adapters/capabilities"

export const prepareAppliedObjectOwnerXML = (params: {
  rule: MetadataItemRule
  context: ConfigurationContextWithExportToXML
  name: string
  preparedYamlFile: PreparedYamlFile
  referenceXML?: Record<string, unknown>
  fileChildNames?: { forms?: readonly string[]; templates?: readonly string[] }
  compositionPropertyValues?: ReadonlyMap<string, unknown>
  profile?: import("../property/fromYAMLToXMLTypes").YAMLToXMLProfile
}): {
  xml: Record<string, unknown>
  deferred: readonly DeferredObjectValue[]
  rootRule: MetadataItemRule
} => {
  const yamlObj = params.preparedYamlFile.data
  if (yamlObj === undefined)
    throw new Error(`Подготовленные YAML-данные отсутствуют: ${params.preparedYamlFile.projectPath}`)

  const contextWithProjectDir: ConfigurationContextWithExportToXML = {
    ...params.context,
    importFromYAML: {
      ...(params.context.importFromYAML ?? {}),
      projectDir: params.context.importFromYAML?.projectDir ?? dirname(dirname(params.preparedYamlFile.filePath)),
    },
  }
  const contextWithFileDiagnostics = withYAMLImportDiagnostics(contextWithProjectDir, {
    sourceFile: params.preparedYamlFile.filePath,
    objectPath: `${params.rule.itemTypePrefix ?? params.rule.itemType}.${params.name}`,
  }) as ConfigurationContextWithExportToXML
  const contextWithFormDir = withImportFormDir(contextWithFileDiagnostics, dirname(params.preparedYamlFile.filePath))
  const contextWithForms: ConfigurationContextWithExportToXML = {
    ...contextWithFormDir,
    exportToXML: {
      ...contextWithFormDir.exportToXML,
      context: {
        ...contextWithFormDir.exportToXML.context,
        forms: [...(params.fileChildNames?.forms ?? [])],
        templates: [...(params.fileChildNames?.templates ?? [])],
        parentName: params.name,
        metadataForNumbering: contextWithFormDir.exportToXML.context?.metadataForNumbering ?? [],
      },
    },
  }
  const contextWithOwner = getChildContextToXML({
    context: withImportMetadataTargetOwner(contextWithForms, params.rule, params.name),
    itemType: params.rule.itemType,
    path: `${params.rule.itemType}.${params.name}`,
    name: params.name,
    externalMetadata: params.rule.externalMetadata,
  })
  const propertyValues = new Map(
    collectFileChildPropertyValues({
      rule: params.rule,
      yaml: yamlObj,
      ownerDir: dirname(params.preparedYamlFile.filePath),
    })
  )
  for (const [propertyKey, value] of params.compositionPropertyValues ?? []) {
    propertyValues.set(propertyKey, value)
  }

  const converted = convertMetadataItemFromYAMLToXML({
    convertProperties: convertPropertiesFromYAMLToXML,
    context: contextWithOwner,
    rule: withFileItemCollectionReferenceExportRules(params.rule),
    yaml: yamlObj,
    name: params.name,
    outputs: [{ key: "owner", referenceXML: params.referenceXML }],
    propertyValues,
    profile: params.profile,
    rulePath: [params.rule.itemType],
  })
  const xmlObj = converted.outputs.get("owner")
  if (xmlObj === undefined) throw new Error("Преобразование объекта не сформировало owner XML")
  return {
    xml: xmlObj,
    deferred: bindDeferredObjectValues(xmlObj, converted.deferredByOutput.get("owner") ?? []),
    rootRule: params.rule,
  }
}

function collectFileChildPropertyValues(params: {
  rule: MetadataItemRule
  yaml: unknown
  ownerDir: string
}): ReadonlyMap<string, unknown> {
  const yaml = asRecord(params.yaml) ?? {}
  const values = new Map<string, unknown>()

  for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
    const descriptor = getFileChildNamesDescriptor(propertyRule)
    if (descriptor === undefined) continue

    const childDir = join(params.ownerDir, descriptor.folderName)
    const names = fs.existsSync(childDir)
      ? fs
          .readdirSync(childDir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)))
      : []
    const expected = descriptor.expectedNames({
      rule: params.rule,
      yaml,
      propertyValue: names,
    })
    if (expected.length > 0) values.set(propertyKey, expected)
  }

  return values
}

registerMetadataXmlPrepareCapability({
  id: "appliedObject",
  run: ({ assignment, context, preparedYamlFile, itemName, logicalAddress, outputs, composition, profile }) => {
    const output = outputs.find((candidate) => candidate.role === "metadata")
    if (output === undefined) return []
    const prepared = prepareAppliedObjectOwnerXML({
      rule: assignment.itemRule,
      context,
      name: itemName,
      preparedYamlFile,
      compositionPropertyValues: collectCompositionChildPropertyValues({
        rule: assignment.itemRule,
        ownerLogicalAddress: logicalAddress,
        composition,
      }),
      profile,
    })
    return [{ declarationId: output.declarationId, targetXmlPath: output.targetXmlPath, ...prepared }]
  },
})

function collectCompositionChildPropertyValues(params: {
  rule: MetadataItemRule
  ownerLogicalAddress: string
  composition: MetadataXmlPrepareComposition
}): ReadonlyMap<string, unknown> {
  const values = new Map<string, unknown>()
  const children = params.composition.children(params.ownerLogicalAddress)
  for (const childCollection of params.rule.childCollections ?? []) {
    const fileItemRule = childCollection.fileItemRule
    if (fileItemRule === undefined) continue
    const names = children
      .filter(
        (entry) =>
          entry.assignmentRole === "fileItem" &&
          entry.itemType === fileItemRule.itemType
      )
      .map((entry) => entry.itemName)
    if (names.length > 0) values.set(childCollection.propertyKey, names)
  }
  return values
}

registerMetadataXmlPrepareCapability({
  id: "itemProperty",
  run: ({ assignment, context, preparedYamlFile, itemName, logicalAddress, outputs, profile }) => {
    const yaml = preparedYamlFile.data
    const itemContext = getChildContextToXML({
      context: withImportMetadataTargetOwner(context, assignment.itemRule, itemName),
      itemType: assignment.itemRule.itemType,
      path: logicalAddress,
      name: itemName,
      externalMetadata: assignment.itemRule.externalMetadata,
    })
    const source = createYAMLPropertySource({
      yaml,
      rule: assignment.itemRule,
      itemName,
      context: itemContext,
    })

    return outputs.flatMap((output) => {
      const propertyKey = output.propertyName
      if (propertyKey === undefined || !source.has(propertyKey)) return []
      const propertyRule = assignment.itemRule.properties[propertyKey]
      if (propertyRule === undefined) return []
      const nestedRule = getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
      if (nestedRule?.kind !== "item") return []
      const itemRule = nestedRule.itemRuleFromProperty?.(propertyRule) ?? nestedRule.itemRule

      const nestedYAML = source.raw(propertyKey)
      const normalizedYAML =
        nestedRule.normalizeYAML?.({ yaml: nestedYAML, name: itemName, propertyRule }) ?? nestedYAML
      const propertyContext = withConfigurationIndexExportPropertyContext(
        itemContext,
        propertyRule.yaml ?? propertyKey,
        propertyRule.configurationIndexUidSegment ?? propertyRule.operationTarget?.migrationSegment,
        { configurationIndexAddressing: propertyRule.configurationIndexAddressing }
      )
      const nestedContext =
        nestedRule.resolveContext?.({ context: propertyContext, name: itemName, propertyRule }) ?? propertyContext
      const nestedItemContext =
        nestedRule.resolveItemContext?.({ context: nestedContext, name: itemName, propertyRule }) ?? nestedContext
      const converted = convertMetadataItemFromYAMLToXML({
        convertProperties: convertPropertiesFromYAMLToXML,
        context: nestedItemContext,
        yaml: normalizedYAML,
        rule: itemRule,
        name: nestedRule.injectOwnerName === true ? itemName : undefined,
        sourceItemName: itemName,
        outputs: [{ key: "property" }],
        sparseYAML: nestedRule.sparseYAML,
        ownerYAML: { itemType: assignment.itemRule.itemType },
        profile,
        rulePath: [assignment.itemRule.itemType, propertyKey],
        deferredRulePath: [{ propertyKey }],
      })
      const xml = converted.outputs.get("property")
      if (xml === undefined) return []
      return [
        {
          declarationId: output.declarationId,
          targetXmlPath: output.targetXmlPath,
          xml,
          deferred: bindDeferredObjectValues(xml, converted.deferredByOutput.get("property") ?? []),
          rootRule: itemRule,
        },
      ]
    })
  },
})

registerMetadataXmlPrepareCapability({
  id: "externalFileProperty",
  run: ({
    assignment,
    context,
    preparedYamlFile,
    baseFormPreparedYamlFile,
    currentConfigurationFormPreparedYamlFile,
    baseFormSourceKind,
    baseConfigurationIndex,
    baseFormContext,
    itemName,
    logicalAddress,
    outputs,
  }) => {
    const contextWithSourceDir = withImportFormDir(context, dirname(preparedYamlFile.filePath))
    const itemContext = getChildContextToXML({
      context: withImportMetadataTargetOwner(contextWithSourceDir, assignment.itemRule, itemName),
      itemType: assignment.itemRule.itemType,
      path: logicalAddress,
      name: itemName,
      externalMetadata: assignment.itemRule.externalMetadata,
    })
    const source = createYAMLPropertySource({
      yaml: preparedYamlFile.data,
      rule: assignment.itemRule,
      itemName,
      context: itemContext,
    })
    const baseSource =
      baseFormPreparedYamlFile === undefined || baseFormContext !== undefined
        ? undefined
        : createYAMLPropertySource({
            yaml: baseFormPreparedYamlFile.data,
            rule: assignment.itemRule,
            itemName,
            context: itemContext,
          })
    const currentConfigurationFormSource =
      currentConfigurationFormPreparedYamlFile === undefined
        ? undefined
        : createYAMLPropertySource({
            yaml: currentConfigurationFormPreparedYamlFile.data,
            rule: assignment.itemRule,
            itemName,
            context: itemContext,
          })

    return outputs.flatMap((output) => {
      const propertyKey = output.propertyName
      if (propertyKey === undefined) return []
      const propertyRule = assignment.itemRule.properties[propertyKey]
      if (propertyRule === undefined) return []
      if (!source.has(propertyKey) && propertyRule.exportReferenceFileOnMissingValue !== true) return []
      const nestedRule = getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
      if (nestedRule?.kind !== "externalFile") return []

      const propertyContext = withConfigurationIndexExportPropertyContext(
        itemContext,
        propertyRule.yaml ?? propertyKey,
        propertyRule.configurationIndexUidSegment ?? propertyRule.operationTarget?.migrationSegment,
        { configurationIndexAddressing: propertyRule.configurationIndexAddressing }
      )
      const xml = nestedRule.convert({
        context: propertyContext,
        yaml: source.raw(propertyKey),
        ...(baseFormPreparedYamlFile !== undefined &&
        currentConfigurationFormPreparedYamlFile !== undefined &&
        baseFormSourceKind !== undefined
          ? {
              baseYAML: {
                kind: "selectedBaseYAML",
                baseFormSourceKind,
                baseFormYAML:
                  baseFormContext !== undefined
                    ? baseFormPreparedYamlFile.data
                    : selectedBasePropertyYAML(output, baseFormPreparedYamlFile, baseSource),
                currentConfigurationFormYAML: selectedBasePropertyYAML(
                  output,
                  currentConfigurationFormPreparedYamlFile,
                  currentConfigurationFormSource
                ),
              },
            }
          : output.baseInput?.value === "wholeYaml" &&
        baseFormPreparedYamlFile !== undefined
          ? { baseYAML: baseFormPreparedYamlFile.data }
          : output.baseInput?.value === "sourceProperty" &&
              output.baseInput.propertyName !== undefined &&
              baseSource !== undefined
            ? {
                baseYAML: baseSource.raw(output.baseInput.propertyName),
              }
            : {}),
        name: itemName,
        referenceXML: undefined,
        ...(baseConfigurationIndex === undefined
          ? {}
          : { baseConfigurationIndex }),
        ...(baseFormContext === undefined ? {} : { baseYAMLContext: baseFormContext }),
      })
      return [
        {
          declarationId: output.declarationId,
          targetXmlPath: output.targetXmlPath,
          xml,
          deferred: [],
          rootRule: assignment.itemRule,
        },
      ]
    })
  },
})

function selectedBasePropertyYAML(
  output: { readonly baseInput?: { readonly value: string; readonly propertyName?: string } },
  prepared: { readonly data?: unknown },
  source: ReturnType<typeof createYAMLPropertySource> | undefined
): unknown {
  if (output.baseInput?.value === "wholeYaml") return prepared.data
  if (output.baseInput?.value === "sourceProperty" && output.baseInput.propertyName !== undefined) {
    return source?.raw(output.baseInput.propertyName)
  }
  return undefined
}

function withImportFormDir(
  context: ConfigurationContextWithExportToXML,
  formDir: string,
  parentName?: string
): ConfigurationContextWithExportToXML {
  return {
    ...context,
    importFromYAML: {
      ...(context.importFromYAML ?? {}),
      formDir,
      parent: parentName ? { name: parentName } : context.importFromYAML?.parent,
    },
  }
}

function withImportMetadataTargetOwner(
  context: ConfigurationContextWithExportToXML,
  rule: MetadataItemRule,
  name: string
): ConfigurationContextWithExportToXML {
  const owner = metadataTargetOwnerFromRule({ itemRule: rule, name, context })
  return {
    ...context,
    importFromYAML: {
      ...context.importFromYAML,
      metadataTargetOwners: [
        ...(context.importFromYAML?.metadataTargetOwners ?? []),
        { itemType: rule.itemType, name, ...(owner ? { owner } : {}) },
      ],
    },
  }
}

function withFileItemCollectionReferenceExportRules(rule: MetadataItemRule): MetadataItemRule {
  let properties: Record<string, PropertyRule> | undefined

  for (const childCollection of rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue

    const propertyRule = rule.properties[childCollection.propertyKey]
    if (!propertyRule) continue

    const xmlRootContainer = getFileItemXMLRootContainer(childCollection.fileItemRule)
    if (!xmlRootContainer) continue

    properties ??= { ...rule.properties }
    const { toXML: _toXML, fromXML: _fromXML, ...rest } = propertyRule
    properties[childCollection.propertyKey] = {
      ...rest,
      xml: propertyRule.xml ?? xmlRootContainer,
      xmlParents: propertyRule.xmlParents ?? ["ChildObjects"],
    } as PropertyRule
  }

  return properties ? ({ ...rule, properties } as MetadataItemRule) : rule
}

function getFileChildNamesDescriptor(rule: PropertyRule): FileChildNamesDescriptor | undefined {
  return getTypeRule(rule.type, "fileChildNamesDescriptor")?.({ propertyRule: rule })
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export const writePreparedAppliedObjectOwnerToXML = async (params: {
  rule: MetadataItemRule
  context: ConfigurationContextWithExportToXML
  name: string
  outputPath: string
  preparedYamlFile: PreparedYamlFile
  referenceXML?: Record<string, unknown>
  fileChildNames?: { forms?: readonly string[]; templates?: readonly string[] }
  profile?: import("../property/fromYAMLToXMLTypes").YAMLToXMLProfile
}): Promise<void> => {
  const prepared = prepareAppliedObjectOwnerXML(params)
  await fs.promises.mkdir(dirname(params.outputPath), { recursive: true })
  await fs.promises.writeFile(params.outputPath, xmlExport(prepared.xml), "utf-8")
}
