import type {
  MetadataRulesDefinition,
  MetadataWorkerOperationContribution,
  MetadataWorkerOperationOutcome,
  MetadataWorkerOperationRuleTypeMap,
  MetadataBaseFormProjector,
} from "../ruleRuntime/definition"
import type { MetadataComponentDescriptor } from "../components/descriptor"
import type { MetadataImportComponentDescriptor } from "../ruleRuntime/definition"
import type { ComponentAddress } from "@nkdk/runtime"
import type { FullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"
import type {
  MetadataExternalTransferCapability,
  MetadataResourceCapabilityContribution,
  MetadataSnapshotImportCapability,
  MetadataXmlPrepareCapability,
} from "../resourceTopology/adapters/capabilities"

export type RulesSynchronizationContribution =
  | FullXmlSyncComponentProfile
  | MetadataResourceCapabilityContribution
import { createMetadataItemXmlImportAugmenterRegistry, type MetadataItemXmlImportAugmenterRegistry } from "../ruleRuntime/metadataItem/augmenterRegistry"
import { createMetadataItemYamlToXmlAugmenterRegistry, type MetadataItemYamlToXmlAugmenterRegistry } from "../ruleRuntime/property/yamlToXmlAugmenter"

export type WorkerOperationKind = keyof MetadataWorkerOperationRuleTypeMap

export interface WorkerOperationRegistry {
  run<Kind extends WorkerOperationKind>(
    command: MetadataWorkerOperationRuleTypeMap[Kind]["command"],
    state: MetadataWorkerOperationRuleTypeMap[Kind]["state"],
  ): Promise<MetadataWorkerOperationRuleTypeMap[Kind]["result"]>
  reset<Kind extends WorkerOperationKind>(
    kind: Kind,
    state: MetadataWorkerOperationRuleTypeMap[Kind]["state"],
    outcome: MetadataWorkerOperationOutcome,
  ): Promise<void>
}

export interface OperationRegistrySet {
  readonly augmentation: {
    readonly xmlImport: MetadataItemXmlImportAugmenterRegistry
    readonly yamlToXml: MetadataItemYamlToXmlAugmenterRegistry
  }
  readonly baseFormProjection: {
    property(propertyType: string): MetadataBaseFormProjector | undefined
    reference(propertyType: string): MetadataBaseFormProjector | undefined
  }
  readonly components: {
    get(kind: string): MetadataComponentDescriptor
    find(kind: string): MetadataComponentDescriptor | undefined
  }
  readonly imports: {
    register(descriptor: MetadataImportComponentDescriptor): void
    resolve(
      root: Readonly<Record<string, unknown>>,
    ): MetadataImportComponentDescriptor
    get(kind: string): MetadataImportComponentDescriptor
  }
  readonly synchronization: {
    resolve(address: ComponentAddress): FullXmlSyncComponentProfile
  }
  readonly resourceCapabilities: {
    xmlPrepare(id: string): MetadataXmlPrepareCapability | undefined
    externalTransfer(id: string): MetadataExternalTransferCapability | undefined
    snapshotImport(id: string): MetadataSnapshotImportCapability | undefined
  }
  readonly worker: WorkerOperationRegistry
}

export function createOperationRegistrySet(
  definition: Pick<
    MetadataRulesDefinition<RulesSynchronizationContribution>,
    "components" | "imports" | "synchronization" | "operations" | "workerOperations"
  >,
): OperationRegistrySet {
  const components = new Map<string, MetadataComponentDescriptor>()
  for (const component of definition.components) {
    if (components.has(component.kind)) {
      throw new Error(
        `Вид metadata-компонента уже зарегистрирован: ${component.kind}`,
      )
    }
    components.set(component.kind, component)
  }
  const imports = new Map<string, MetadataImportComponentDescriptor>()
  for (const descriptor of definition.imports) {
    if (imports.has(descriptor.kind)) {
      throw new Error(
        `Вид XML-компонента уже зарегистрирован: ${descriptor.kind}`,
      )
    }
    imports.set(descriptor.kind, descriptor)
  }
  const workerOperations = new Map<
    WorkerOperationKind,
    MetadataWorkerOperationContribution
  >()
  const synchronization = new Map<string, FullXmlSyncComponentProfile>()
  const xmlPrepareCapabilities = new Map<string, MetadataXmlPrepareCapability>()
  const externalTransferCapabilities = new Map<string, MetadataExternalTransferCapability>()
  const snapshotImportCapabilities = new Map<string, MetadataSnapshotImportCapability>()
  for (const contribution of definition.synchronization) {
    if (contribution.kind === "xmlPrepareCapability") {
      xmlPrepareCapabilities.set(contribution.capability.id, contribution.capability)
      continue
    }
    if (contribution.kind === "externalTransferCapability") {
      externalTransferCapabilities.set(contribution.capability.id, contribution.capability)
      continue
    }
    if (contribution.kind === "snapshotImportCapability") {
      snapshotImportCapabilities.set(contribution.capability.id, contribution.capability)
      continue
    }
    const profile = contribution
    if (synchronization.has(profile.kind)) {
      throw new Error(
        `Профиль XML-синхронизации уже зарегистрирован: ${profile.kind}`,
      )
    }
    synchronization.set(profile.kind, profile)
  }
  for (const operation of definition.workerOperations) {
    if (workerOperations.has(operation.kind)) {
      throw new Error(
        `Worker operation уже зарегистрирована: ${String(operation.kind)}`,
      )
    }
    workerOperations.set(operation.kind, operation)
  }
  const xmlImportAugmenters = createMetadataItemXmlImportAugmenterRegistry(
    definition.operations.flatMap((operation) => operation.kind === "xmlImportAugmenter"
      ? [{ name: operation.name, augmenter: operation.augmenter }]
      : []),
  )
  const yamlToXmlAugmenters = createMetadataItemYamlToXmlAugmenterRegistry(
    definition.operations.flatMap((operation) => operation.kind === "yamlToXmlAugmenter"
      ? [{ componentKind: operation.componentKind, augmenter: operation.augmenter }]
      : []),
  )
  const baseFormPropertyProjectors = new Map<string, MetadataBaseFormProjector>()
  const baseFormReferenceProjectors = new Map<string, MetadataBaseFormProjector>()
  for (const operation of definition.operations) {
    if (operation.kind === "baseFormPropertyProjector") {
      baseFormPropertyProjectors.set(operation.propertyType, operation.projector)
    } else if (operation.kind === "baseFormReferenceProjector") {
      baseFormReferenceProjectors.set(operation.propertyType, operation.projector)
    }
  }

  return {
    augmentation: { xmlImport: xmlImportAugmenters, yamlToXml: yamlToXmlAugmenters },
    baseFormProjection: {
      property: (propertyType) => baseFormPropertyProjectors.get(propertyType),
      reference: (propertyType) => baseFormReferenceProjectors.get(propertyType),
    },
    components: {
      get(kind) {
        const component = components.get(kind)
        if (component === undefined) {
          throw new Error(`Не найдено описание metadata-компонента: ${kind}`)
        }
        return component
      },
      find(kind) {
        return components.get(kind)
      },
    },
    imports: {
      register(descriptor) {
        if (imports.has(descriptor.kind)) {
          throw new Error(`Вид XML-компонента уже зарегистрирован: ${descriptor.kind}`)
        }
        imports.set(descriptor.kind, descriptor)
      },
      resolve(root) {
        const matches = [...imports.values()].filter((descriptor) =>
          descriptor.detect(root),
        )
        if (matches.length === 0) {
          throw new Error("Не найдено описание XML-компонента")
        }
        if (matches.length > 1) {
          throw new Error(
            `Несколько описаний XML-компонента распознали корень: ${matches
              .map(({ kind }) => kind)
              .join(", ")}`,
          )
        }
        return matches[0] as MetadataImportComponentDescriptor
      },
      get(kind) {
        const descriptor = imports.get(kind)
        if (descriptor === undefined) {
          throw new Error(`Не найдено описание XML-компонента: ${kind}`)
        }
        return descriptor
      },
    },
    synchronization: {
      resolve(address) {
        const matches = [...synchronization.values()].filter((profile) =>
          profile.supports(address),
        )
        if (matches.length === 0) {
          throw new Error(
            `Не найден профиль XML-синхронизации для компонента: ${address.kind}`,
          )
        }
        if (matches.length > 1) {
          throw new Error(
            `Несколько профилей XML-синхронизации поддерживают компонент: ${address.kind}`,
          )
        }
        return matches[0] as FullXmlSyncComponentProfile
      },
    },
    resourceCapabilities: {
      xmlPrepare: (id) => xmlPrepareCapabilities.get(id),
      externalTransfer: (id) => externalTransferCapabilities.get(id),
      snapshotImport: (id) => snapshotImportCapabilities.get(id),
    },
    worker: {
      async run<Kind extends WorkerOperationKind>(
        command: MetadataWorkerOperationRuleTypeMap[Kind]["command"],
        state: MetadataWorkerOperationRuleTypeMap[Kind]["state"],
      ): Promise<MetadataWorkerOperationRuleTypeMap[Kind]["result"]> {
        const operation = workerOperations.get(command.kind)
        if (operation === undefined) {
          throw new Error(`Worker operation не зарегистрирована: ${command.kind}`)
        }
        return runWorkerOperation(operation, command, state)
      },
      async reset<Kind extends WorkerOperationKind>(
        kind: Kind,
        state: MetadataWorkerOperationRuleTypeMap[Kind]["state"],
        outcome: MetadataWorkerOperationOutcome,
      ): Promise<void> {
        const operation = workerOperations.get(kind)
        if (operation === undefined) return
        await resetWorkerOperation(operation, state, outcome)
      },
    },
  }
}

async function runWorkerOperation<Kind extends WorkerOperationKind>(
  operation: Extract<
    MetadataWorkerOperationContribution,
    { readonly kind: Kind }
  >,
  command: MetadataWorkerOperationRuleTypeMap[Kind]["command"],
  state: MetadataWorkerOperationRuleTypeMap[Kind]["state"],
): Promise<MetadataWorkerOperationRuleTypeMap[Kind]["result"]> {
  return operation.handler(command, state)
}

async function resetWorkerOperation<Kind extends WorkerOperationKind>(
  operation: Extract<
    MetadataWorkerOperationContribution,
    { readonly kind: Kind }
  >,
  state: MetadataWorkerOperationRuleTypeMap[Kind]["state"],
  outcome: MetadataWorkerOperationOutcome,
): Promise<void> {
  await operation.reset?.(state, outcome)
}
