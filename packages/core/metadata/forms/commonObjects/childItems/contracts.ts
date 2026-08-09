import type {
  CollectableElementToYAML,
  CollectableElementType,
} from "../../../orchestration/formElement/types"

export type FormElementTreeYAML = Record<string, FormElementTreeNodeYAML>

export type FormElementTreeNodeYAML = {
  Вид: CollectableElementToYAML<CollectableElementType>
  Элементы?: FormElementTreeYAML
} & Record<string, unknown>
