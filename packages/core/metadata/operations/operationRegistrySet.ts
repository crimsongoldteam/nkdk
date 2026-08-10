import type {
  MetadataRulesDefinition,
  MetadataWorkerOperationContribution,
  MetadataWorkerOperationOutcome,
  MetadataWorkerOperationRuleTypeMap,
} from "../ruleRuntime/definition"
import type { MetadataComponentDescriptor } from "../components/descriptor"
import type { MetadataImportComponentDescriptor } from "../ruleRuntime/definition"
import type { ComponentAddress } from "../components/address"
import type { FullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"

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
  readonly components: {
    get(kind: string): MetadataComponentDescriptor
    find(kind: string): MetadataComponentDescriptor | undefined
  }
  readonly imports: {
    resolve(
      root: Readonly<Record<string, unknown>>,
    ): MetadataImportComponentDescriptor
    get(kind: string): MetadataImportComponentDescriptor
  }
  readonly synchronization: {
    resolve(address: ComponentAddress): FullXmlSyncComponentProfile
  }
  readonly worker: WorkerOperationRegistry
}

export function createOperationRegistrySet(
  definition: Pick<
    MetadataRulesDefinition<FullXmlSyncComponentProfile>,
    "components" | "imports" | "synchronization" | "workerOperations"
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
  for (const profile of definition.synchronization) {
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

  return {
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
