import {
  validationIssueTargetKey,
  type ValidationIssue,
  type ValidationIssueTarget,
} from "./validationIssue"

export interface XmlAnomalyBoundaryEvaluation {
  readonly accepted: readonly ValidationIssue[]
  readonly visible: readonly ValidationIssue[]
  readonly contract: readonly ValidationIssue[]
  readonly state?: XmlAnomalyValidationState
}

export type XmlAnomalyValidationState = "pending" | "accepted"

export function evaluateXmlAnomalyBoundary(params: {
  readonly annotation: "invalid" | "important"
  readonly target: ValidationIssueTarget
  readonly issues: readonly ValidationIssue[]
  readonly importantRegistered: boolean
  readonly deferUnnecessary?: boolean
}): XmlAnomalyBoundaryEvaluation {
  const targetKey = validationIssueTargetKey(params.target)
  const accepted = params.issues.filter((issue) =>
    issue.kind === "semantic" && validationIssueTargetKey(issue.target) === targetKey)
  const visible = params.issues.filter((issue) => !accepted.includes(issue))
  const contract: ValidationIssue[] = []

  if (params.annotation === "important" && !params.importantRegistered) {
    contract.push(contractIssue("xml/important-not-registered", params))
  } else if (params.annotation === "invalid" && params.importantRegistered) {
    contract.push(contractIssue("xml/important-required", params))
  } else if (accepted.length === 0 && params.deferUnnecessary !== true) {
    contract.push(contractIssue("xml/anomaly-tag-unnecessary", params))
  }

  const state = accepted.length > 0
    ? "accepted"
    : params.deferUnnecessary === true
      ? "pending"
      : undefined

  return {
    accepted,
    visible,
    contract,
    ...(state === undefined ? {} : { state }),
  }
}

function contractIssue(
  code: string,
  params: Pick<Parameters<typeof evaluateXmlAnomalyBoundary>[0], "annotation" | "target">,
): ValidationIssue {
  return {
    code,
    kind: "semantic",
    target: params.target,
    params: { annotation: params.annotation },
  }
}
