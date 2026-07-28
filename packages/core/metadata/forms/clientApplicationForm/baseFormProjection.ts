import type {
  FormElementTreeNodeYAML,
  FormElementTreeYAML,
} from "../commonObjects/childItems/types"
import type { ClientApplicationFormYAML } from "./types"

export interface ProjectedBaseForm {
  readonly yaml: ClientApplicationFormYAML
  readonly explicitComponents: {
    readonly attributes: ReadonlySet<string>
    readonly commands: ReadonlySet<string>
    readonly parameters: ReadonlySet<string>
  }
}

export function projectClientApplicationBaseForm(params: {
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
}): ProjectedBaseForm {
  const extensionElementsByName = indexElementsByName(params.extensionYaml.Элементы)
  const attributes = intersectNamedComponents(
    params.baseYaml.Реквизиты,
    params.extensionYaml.Реквизиты
  )
  const commands = intersectNamedComponents(
    params.baseYaml.Команды,
    params.extensionYaml.Команды
  )
  const parameters = intersectNamedComponents(
    params.baseYaml.Параметры,
    params.extensionYaml.Параметры
  )
  const elements =
    params.baseYaml.Элементы === undefined
      ? undefined
      : projectElementTree(params.baseYaml.Элементы, extensionElementsByName)
  const yaml: ClientApplicationFormYAML = {
    ...(elements === undefined ? {} : { Элементы: elements }),
    ...(attributes.values === undefined
      ? {}
      : { Реквизиты: attributes.values }),
    ...(commands.values === undefined ? {} : { Команды: commands.values }),
    ...(parameters.values === undefined ? {} : { Параметры: parameters.values }),
  }

  return {
    yaml,
    explicitComponents: {
      attributes: attributes.names,
      commands: commands.names,
      parameters: parameters.names,
    },
  }
}

function indexElementsByName(
  elements: FormElementTreeYAML | undefined
): ReadonlyMap<string, FormElementTreeNodeYAML> {
  const result = new Map<string, FormElementTreeNodeYAML>()

  visitElementTree(elements, (name, element) => {
    if (result.has(name)) {
      throw new Error(`External form contains duplicate element name "${name}"`)
    }
    result.set(name, element)
  })

  return result
}

function visitElementTree(
  elements: FormElementTreeYAML | undefined,
  visit: (name: string, element: FormElementTreeNodeYAML) => void
): void {
  if (elements === undefined) return

  for (const [name, element] of Object.entries(elements)) {
    visit(name, element)
    visitElementTree(element.Элементы, visit)
  }
}

function projectElementTree(
  baseElements: FormElementTreeYAML,
  extensionElementsByName: ReadonlyMap<string, FormElementTreeNodeYAML>
): FormElementTreeYAML {
  return Object.fromEntries(
    Object.entries(baseElements).map(([name, baseElement]) => [
      name,
      projectElementSelection({
        baseElement,
        extensionElement: extensionElementsByName.get(name),
        extensionElementsByName,
      }),
    ])
  )
}

function projectElementSelection(params: {
  readonly baseElement: FormElementTreeNodeYAML
  readonly extensionElement: FormElementTreeNodeYAML | undefined
  readonly extensionElementsByName: ReadonlyMap<string, FormElementTreeNodeYAML>
}): FormElementTreeNodeYAML {
  const result: FormElementTreeNodeYAML = { Вид: params.baseElement.Вид }

  if (params.baseElement.Элементы !== undefined) {
    result.Элементы = projectElementTree(
      params.baseElement.Элементы,
      params.extensionElementsByName
    )
  }

  return result
}

function intersectNamedComponents<Value>(
  baseValues: Record<string, Value> | undefined,
  extensionValues: Record<string, unknown> | undefined
): {
  readonly values: Record<string, Value> | undefined
  readonly names: ReadonlySet<string>
} {
  if (baseValues === undefined) {
    return { values: undefined, names: new Set() }
  }

  const names = new Set<string>()
  const values: Record<string, Value> = {}

  for (const [name, value] of Object.entries(baseValues)) {
    if (!Object.hasOwn(extensionValues ?? {}, name)) continue
    names.add(name)
    values[name] = value
  }

  return { values, names }
}
