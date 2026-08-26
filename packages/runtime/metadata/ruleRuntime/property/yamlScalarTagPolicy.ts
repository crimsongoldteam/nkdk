import {
  isPropertyStateYAMLTag,
  type XMLRepresentationYAMLTag,
  type YAMLScalarTag,
} from "../../../yaml/scalarTags"

export interface YAMLScalarTagPolicy {
  readonly acceptedTags: readonly XMLRepresentationYAMLTag[]
}

export function assertYAMLScalarTagAllowed(params: {
  readonly tag: YAMLScalarTag | undefined
  readonly policy?: YAMLScalarTagPolicy
}): void {
  if (params.tag === undefined || isPropertyStateYAMLTag(params.tag)) return
  if (params.policy?.acceptedTags.includes(params.tag) === true) return
  throw new Error(`Тег !${params.tag} недопустим для этого типа свойства`)
}
