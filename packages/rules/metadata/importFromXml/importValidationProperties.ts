import { getProjectReferenceMemberIndexContributors } from "../validation/projectReferenceIndexRegistry"

/** Корневые значения, которые читают зарегистрированные участники общего индекса. */
export function importValidationPropertyNames(): ReadonlySet<string> {
  return new Set(["Тип", ...getProjectReferenceMemberIndexContributors().flatMap(({ yamlProperties }) => yamlProperties)])
}
