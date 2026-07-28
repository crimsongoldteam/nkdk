import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import { childUid } from "../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexPropertyOrder,
  withConfigurationIndexExportXmlNodeLogicalAddress,
} from "../../configurationIndex/referenceView"
import type { ConfigurationIndexReader } from "../../configurationIndex/sharedSnapshot"
import type {
  ClientApplicationFormXML,
  ClientApplicationFormYAML,
} from "./types"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import {
  createBaseFormConfigurationIndexReader,
  type BaseFormNodeProjection,
} from "./baseFormIndex"
import { projectClientApplicationBaseForm } from "./baseFormProjection"
import { ClientApplicationFormRules } from "./rules"
import { resolveFormElementRule } from "../elements/orchestration/fromYAMLToXML"
import type {
  FormElementTreeYAML,
} from "../commonObjects/childItems/types"
import type {
  MetadataItemRule,
  PropertyRule,
} from "../../orchestration/property/types"
import { getTypeRule } from "../../orchestration/property/typeRuleRegistry"

export function buildClientApplicationBaseForm(params: {
  readonly context: ConfigurationContextWithExportToXML
  readonly baseIndex: ConfigurationIndexReader
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly formName: string
}): ClientApplicationFormXML {
  const projected = projectClientApplicationBaseForm({
    baseYaml: params.baseYaml,
    extensionYaml: params.extensionYaml,
  })
  const runtime = params.context.exportToXML.configurationIndex
  const formBodyAddress =
    runtime === undefined
      ? undefined
      : childUid(runtime.logicalAddress, "ЧастьФормы", "Содержимое")
  const projectedSource =
    runtime === undefined || formBodyAddress === undefined
      ? undefined
      : createBaseFormConfigurationIndexReader({
          base: params.baseIndex,
          extension: runtime.source,
          extensionIdentityAddresses: extensionIdentityAddresses({
            formAddress: runtime.logicalAddress,
            projected,
          }),
          nodeProjections: projectedNodeProjections({
            formAddress: runtime.logicalAddress,
            formBodyAddress,
            yaml: projected.yaml,
            effectiveRootPropertyOrder:
              params.context.exportToXML.indexedPropertyOrderByLogicalAddress?.[
                runtime.logicalAddress
              ] ??
              getConfigurationIndexPropertyOrder(
                withConfigurationIndexExportXmlNodeLogicalAddress(
                  params.context,
                  formBodyAddress
                )
              ),
          }),
        })
  const context = withDiscardedConfigurationIndexWrites(
    params.context,
    projectedSource
  )
  const converted = convertClientApplicationFormFromYAMLToXML({
    context,
    yaml: projected.yaml,
    dataPathYaml: projected.yaml,
    name: params.formName,
  }).formXML
  return Object.fromEntries(
    Object.entries(converted).filter(([key]) => !key.startsWith("_xmlns"))
  ) as ClientApplicationFormXML
}

function selectedPropertyKeys(
  yaml: unknown,
  rule: MetadataItemRule
): ReadonlySet<string> {
  const selected = new Set<string>()
  if (yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) {
    return selected
  }
  for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
    if (Object.hasOwn(yaml, propertyRule.yaml ?? propertyKey)) {
      selected.add(propertyKey)
    }
  }
  return selected
}

function projectedNodeProjections(params: {
  readonly formAddress: string
  readonly formBodyAddress: string
  readonly yaml: ClientApplicationFormYAML
  readonly effectiveRootPropertyOrder: readonly string[]
}): readonly BaseFormNodeProjection[] {
  const result: BaseFormNodeProjection[] = [{
    logicalAddress: params.formAddress,
    xmlNodeLogicalAddress: params.formBodyAddress,
    rule: ClientApplicationFormRules,
    selectedPropertyKeys: selectedPropertyKeys(
      params.yaml,
      ClientApplicationFormRules
    ),
    effectivePropertyOrder: params.effectiveRootPropertyOrder,
  }]
  visitProjectedElements({
    formAddress: params.formAddress,
    elements: params.yaml.Элементы,
    collectionRule: ClientApplicationFormRules.properties.childItems,
    result,
  })
  return result
}

function visitProjectedElements(params: {
  readonly formAddress: string
  readonly elements: FormElementTreeYAML | undefined
  readonly collectionRule: PropertyRule
  readonly result: BaseFormNodeProjection[]
}): void {
  if (params.elements === undefined) return
  for (const [index, [name, yaml]] of Object.entries(params.elements).entries()) {
    const rule = resolveFormElementRule({
      yaml,
      name,
      propertyRule: params.collectionRule,
    })
    const logicalAddress = childUid(params.formAddress, "Элемент", name)
    params.result.push({
      logicalAddress,
      xmlNodeLogicalAddress: logicalAddress,
      rule,
      selectedPropertyKeys: selectedPropertyKeys(
        normalizeCollectionItemYAML({
          yaml,
          name,
          index,
          collectionRule: params.collectionRule,
        }),
        rule
      ),
    })
    const children = yaml.Элементы
    const childCollectionRule = propertyRuleByYamlKey(rule, "Элементы")
    if (children !== undefined && childCollectionRule !== undefined) {
      visitProjectedElements({
        formAddress: params.formAddress,
        elements: children,
        collectionRule: childCollectionRule,
        result: params.result,
      })
    }
  }
}

function normalizeCollectionItemYAML(params: {
  readonly yaml: unknown
  readonly name: string
  readonly index: number
  readonly collectionRule: PropertyRule
}): unknown {
  const nestedRule = getTypeRule(
    params.collectionRule.type,
    "yamlToXMLNestedRule"
  )
  return nestedRule?.kind === "collection"
    ? nestedRule.normalizeItemYAML?.({
        yaml: params.yaml,
        name: params.name,
        index: params.index,
        propertyRule: params.collectionRule,
      }) ?? params.yaml
    : params.yaml
}

function propertyRuleByYamlKey(
  rule: MetadataItemRule,
  yamlKey: string
): PropertyRule | undefined {
  return Object.entries(rule.properties).find(
    ([propertyKey, propertyRule]) =>
      (propertyRule.yaml ?? propertyKey) === yamlKey
  )?.[1]
}

function withDiscardedConfigurationIndexWrites(
  context: ConfigurationContextWithExportToXML,
  source: ConfigurationIndexReader | undefined
): ConfigurationContextWithExportToXML {
  const runtime = context.exportToXML.configurationIndex
  if (runtime === undefined) return context
  const configurationIndex = createConfigurationIndexExportRuntime({
    source: source ?? runtime.source,
    collector: createConfigurationIndexCollector(),
    targetProjectPath: runtime.targetProjectPath,
    logicalAddress: runtime.logicalAddress,
    ...(runtime.xmlNodeLogicalAddress === undefined
      ? {}
      : { xmlNodeLogicalAddress: runtime.xmlNodeLogicalAddress }),
    ...(runtime.formElementRootLogicalAddress === undefined
      ? {}
      : { formElementRootLogicalAddress: runtime.formElementRootLogicalAddress }),
    ...(runtime.childCollectionUidSegment === undefined
      ? {}
      : { childCollectionUidSegment: runtime.childCollectionUidSegment }),
    ...(runtime.yamlPathAddressing === undefined
      ? {}
      : { yamlPathAddressing: runtime.yamlPathAddressing }),
  })
  return {
    ...context,
    exportToXML: {
      ...context.exportToXML,
      configurationIndex,
      xmlDefaultVariantByLogicalAddress: {
        ...context.exportToXML.xmlDefaultVariantByLogicalAddress,
        [runtime.logicalAddress]: "indexed",
      },
    },
  }
}

function extensionIdentityAddresses(params: {
  readonly formAddress: string
  readonly projected: ReturnType<typeof projectClientApplicationBaseForm>
}): ReadonlySet<string> {
  return new Set([
    ...[...params.projected.explicitComponents.attributes].map((name) =>
      childUid(params.formAddress, "Атрибут", name)
    ),
    ...[...params.projected.explicitComponents.commands].map((name) =>
      childUid(params.formAddress, "Команда", name)
    ),
    ...[...params.projected.explicitComponents.parameters].map((name) =>
      childUid(params.formAddress, "Параметр", name)
    ),
  ])
}
