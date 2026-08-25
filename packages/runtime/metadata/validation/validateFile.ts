import type { ValidationSchemaValidator } from "./compileValidationSchema"
import { parseMetadataYaml, type ParsedYaml } from "../../yaml/parseMetadataYaml"
import { typeboxErrorsToDiagnostics } from "./typeboxErrorsToDiagnostics"
import { Diagnostic } from "./types"
import { structuralYamlValue } from "./structuralYamlValue"
import {
  typeboxErrorsToValidationIssues,
  validationIssuePathFromPointer,
  type ValidationIssue,
} from "./validationIssue"
import {
  evaluateXmlAnomalyBoundary,
  type XmlAnomalyValidationState,
} from "./xmlAnomalyBoundary"
import { diagnosticAtYamlPath } from "./yamlLocations"
import type { ValidationIssueTarget } from "./validationIssue"

export interface ValidateFileParams {
  filePath: string
  text: string
  schema: ValidationSchemaValidator
}

export interface ValidateParsedFileParams {
  filePath: string
  parsed: ParsedYaml
  schema: ValidationSchemaValidator
  importantRegistered?: (target: ValidationIssueTarget) => boolean
  evaluateXmlAnomalies?: boolean
}

export function validateFile({ filePath, text, schema }: ValidateFileParams): Diagnostic[] {
  const parsed = parseMetadataYaml(text)

  return validateParsedFile({ filePath, parsed, schema })
}

export function validateParsedFile({ filePath, parsed, schema }: ValidateParsedFileParams): Diagnostic[] {
  return validateParsedFileWithIssues({ filePath, parsed, schema }).diagnostics
}

export function validateParsedFileWithIssues(
  {
    filePath,
    parsed,
    schema,
    importantRegistered = () => false,
    evaluateXmlAnomalies = true,
  }: ValidateParsedFileParams,
): ParsedXmlAnomalyEvaluation {
  // Short-circuit: при синтаксической ошибке TypeBox и external-file не запускаются
  if (parsed.syntaxErrors.length > 0) {
    return {
      diagnostics: parsed.syntaxErrors.map((error) => ({
        filePath,
        line: error.line,
        col: error.col,
        message: error.message,
        severity: "error" as const,
        source: "syntax" as const,
      })),
      issues: parsed.syntaxErrors.map((error) => ({
        code: "yaml.syntax",
        kind: "infrastructure" as const,
        target: { kind: "path" as const, path: [] },
        params: { line: error.line, col: error.col, message: error.message },
      })),
      boundaries: [],
    }
  }

  const [valid, errors] = schema.Errors(structuralYamlValue(parsed.data, parsed.annotations))
  const schemaIssues = (valid ? [] : typeboxErrorsToValidationIssues(errors))
    .map((issue) => logicalIssueTarget(issue, parsed.data, parsed.annotations))
    .filter((issue) => !isHiddenByRawWithoutSemantic(issue.target.path, parsed.data, parsed.annotations))
  const issues = [
    ...schemaIssues,
    ...duplicateAnnotatedKeyIssues(parsed.data, parsed.annotations),
  ]
  const schemaDiagnostics = (valid ? [] : typeboxErrorsToDiagnostics(errors, parsed, filePath))
    .filter((diagnostic) => !isHiddenByRawWithoutSemantic(
      validationIssuePathFromPointer(diagnostic.path ?? ""),
      parsed.data,
      parsed.annotations,
    ))
  if (!evaluateXmlAnomalies) return { diagnostics: schemaDiagnostics, issues, boundaries: [] }
  return evaluateParsedXmlAnomalyBoundaries({
    filePath,
    parsed,
    issues,
    diagnostics: schemaDiagnostics,
    importantRegistered,
  })
}

function duplicateAnnotatedKeyIssues(
  root: unknown,
  annotations: ParsedYaml["annotations"],
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const visit = (value: unknown, path: readonly (string | number)[]): void => {
    if (Array.isArray(value)) {
      value.forEach((child, index) => visit(child, [...path, index]))
      return
    }
    if (typeof value !== "object" || value === null) return
    const record = value as Record<string, unknown>
    const entries = Object.keys(record).map((runtimeKey) => {
      const annotation = annotations.keyAt(record, runtimeKey)
      return { runtimeKey, annotation, logicalKey: annotation?.logicalKey ?? runtimeKey }
    })
    const counts = new Map<string, number>()
    for (const { logicalKey } of entries) counts.set(logicalKey, (counts.get(logicalKey) ?? 0) + 1)
    for (const { runtimeKey, annotation, logicalKey } of entries) {
      if (
        counts.get(logicalKey)! > 1
        && (annotation?.kind === "invalid" || annotation?.kind === "important")
      ) {
        issues.push({
          code: "rules.duplicate-property",
          kind: "semantic",
          target: { kind: "occurrence", path: [...path, logicalKey], occurrence: annotation.occurrence },
          params: { logicalKey, occurrence: annotation.occurrence },
        })
      }
      visit(record[runtimeKey], [...path, logicalKey])
    }
  }
  visit(root, [])
  return issues
}

export function evaluateParsedXmlAnomalyBoundaries(params: {
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly issues: readonly ValidationIssue[]
  readonly diagnostics: readonly Diagnostic[]
  readonly importantRegistered?: (target: ValidationIssueTarget) => boolean
  readonly deferUnnecessaryFor?: (target: ValidationIssueTarget) => boolean
}): ParsedXmlAnomalyEvaluation {
  let visibleIssues = [...params.issues]
  const contractIssues: ValidationIssue[] = []
  const acceptedTargets = new Set<string>()
  const boundaries: XmlAnomalyBoundaryState[] = []
  for (const boundary of semanticAnomalyBoundaries(params.parsed.data, params.parsed.annotations)) {
    const evaluated = evaluateXmlAnomalyBoundary({
      annotation: boundary.annotation,
      target: boundary.target,
      issues: visibleIssues,
      importantRegistered: params.importantRegistered?.(boundary.target) ?? false,
      deferUnnecessary: params.deferUnnecessaryFor?.(boundary.target) ?? false,
    })
    visibleIssues = [...evaluated.visible]
    contractIssues.push(...evaluated.contract)
    if (evaluated.accepted.length > 0) acceptedTargets.add(pointerForTarget(boundary.target))
    if (evaluated.state !== undefined) boundaries.push({ ...boundary, state: evaluated.state })
  }
  const diagnostics = params.diagnostics.filter((diagnostic) =>
    !acceptedTargets.has(diagnostic.path ?? "/"))
  diagnostics.push(...contractIssues.map((issue) =>
    diagnosticForContractIssue(params.filePath, params.parsed, issue)))
  return { diagnostics, issues: [...visibleIssues, ...contractIssues], boundaries }
}

export interface XmlAnomalyBoundaryState {
  readonly annotation: "invalid" | "important"
  readonly target: ValidationIssueTarget
  readonly state: XmlAnomalyValidationState
}

export interface ParsedXmlAnomalyEvaluation {
  readonly diagnostics: Diagnostic[]
  readonly issues: ValidationIssue[]
  readonly boundaries: readonly XmlAnomalyBoundaryState[]
}

function semanticAnomalyBoundaries(
  root: unknown,
  annotations: ParsedYaml["annotations"],
): { annotation: "invalid" | "important"; target: ValidationIssueTarget }[] {
  const result: { annotation: "invalid" | "important"; target: ValidationIssueTarget }[] = []
  const visit = (value: unknown, path: readonly (string | number)[]): void => {
    if (typeof value !== "object" || value === null) return
    for (const runtimeKey of Object.keys(value)) {
      const keyAnnotation = annotations.keyAt(value, runtimeKey)
      const logicalKey = keyAnnotation?.logicalKey ?? runtimeKey
      const childPath = [...path, logicalKey]
      if (keyAnnotation?.kind === "invalid" || keyAnnotation?.kind === "important") {
        result.push({
          annotation: keyAnnotation.kind,
          target: { kind: "occurrence", path: childPath, occurrence: keyAnnotation.occurrence },
        })
      }
      const valueAnnotation = annotations.at(value, runtimeKey)
      const semantic = valueAnnotation?.kind === "raw" ? valueAnnotation.semantic : valueAnnotation
      if (semantic?.kind === "invalid" || semantic?.kind === "important") {
        result.push({
          annotation: semantic.kind,
          target: (value as Record<string, unknown>)[runtimeKey] === undefined
            ? { kind: "missing", path: childPath }
            : { kind: "path", path: childPath },
        })
      }
      visit((value as Record<string, unknown>)[runtimeKey], childPath)
    }
  }
  visit(root, [])
  return result
}

function pointerForTarget(target: ValidationIssueTarget): string {
  return `/${target.path.map((segment) => String(segment)
    .replace(/~/gu, "~0").replace(/\//gu, "~1")).join("/")}`
}

function diagnosticForContractIssue(
  filePath: string,
  parsed: ParsedYaml,
  issue: ValidationIssue,
): Diagnostic {
  const messages: Record<string, string> = {
    "xml/anomaly-tag-unnecessary": "Тег XML-аномалии лишний: значение не содержит ошибки",
    "xml/important-not-registered": "Тег !xml/important не зарегистрирован для этого значения",
    "xml/important-required": "Для этого значения требуется !xml/important",
  }
  return diagnosticAtYamlPath({
    filePath,
    parsed,
    path: issue.target.path,
    message: messages[issue.code] ?? issue.code,
    severity: "error",
    source: "structure",
  })
}

function logicalIssueTarget(
  issue: ValidationIssue,
  root: unknown,
  annotations: ParsedYaml["annotations"],
): ValidationIssue {
  let parent = root
  let occurrence: number | undefined
  const path = issue.target.path.map((segment) => {
    if (typeof parent !== "object" || parent === null) return segment
    const annotation = typeof segment === "string" ? annotations.keyAt(parent, segment) : undefined
    const logical = annotation?.logicalKey ?? segment
    occurrence ??= annotation?.occurrence
    parent = (parent as Record<string | number, unknown>)[segment]
    return logical
  })
  return occurrence === undefined
    ? { ...issue, target: { ...issue.target, path } }
    : { ...issue, target: { kind: "occurrence", path, occurrence } }
}

function isHiddenByRawWithoutSemantic(
  path: readonly (string | number)[],
  root: unknown,
  annotations: ParsedYaml["annotations"],
): boolean {
  let parent = root
  for (const segment of path) {
    if (typeof parent !== "object" || parent === null) return false
    const annotation = annotations.at(parent, segment)
    if (annotation?.kind === "raw" && annotation.hasSemanticValue !== true) return true
    parent = (parent as Record<string | number, unknown>)[segment]
  }
  return false
}
