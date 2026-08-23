import {
  classifyFillValue,
  type FillValueAlternative,
  type FillValueEffectiveType,
  type FillValueTypedValue,
} from "@nkdk/runtime/rule-kit"
import type {
  NormalizedType,
  NormalizedTypeAlternative,
  RawFillValue,
  ValueCategory,
} from "./model"

export function normalizeEffectiveType(
  effectiveType: FillValueEffectiveType,
  source: NormalizedType["source"],
  sourceType?: unknown,
): NormalizedType {
  if (effectiveType.status === "unresolved") {
    return {
      source,
      ...(sourceType === undefined ? {} : { sourceType }),
      family: "unresolved",
      signature: `unresolved(${effectiveType.reason})`,
      alternatives: [],
      reason: effectiveType.reason,
    }
  }
  if (effectiveType.status === "notSpecified") {
    return {
      source,
      ...(sourceType === undefined ? {} : { sourceType }),
      family: "unresolved",
      signature: "notSpecified",
      alternatives: [],
      reason: "тип значения заполнения не задан правилами",
    }
  }

  const alternatives = effectiveType.alternatives
    .map(normalizeAlternative)
    .sort((left, right) => alternativeSignature(left).localeCompare(alternativeSignature(right)))
  const composite = effectiveType.composite || alternatives.length > 1
  const family = composite ? "composite" : (alternatives[0]?.kind ?? "unresolved")
  const body = alternatives.map(alternativeSignature).join("|")
  return {
    source,
    ...(sourceType === undefined ? {} : { sourceType }),
    family,
    signature: composite ? `composite(${body})` : (body || "unresolved(empty)"),
    alternatives,
    ...(alternatives.length === 0 ? { reason: "эффективный тип не содержит альтернатив" } : {}),
  }
}

export function classifyObservedValue(params: {
  readonly raw: RawFillValue
  readonly typedValue?: FillValueTypedValue
  readonly effectiveType: FillValueEffectiveType
}): ValueCategory {
  if (params.raw.form === "absent") return "absent"

  const semanticClassification = params.typedValue === undefined
    ? undefined
    : classifyFillValue({ effectiveType: params.effectiveType, value: params.typedValue })
  if (semanticClassification?.kind === "invalid") return "invalid"

  const referenceCategory = classifyReference(params.typedValue, params.raw)
  if (referenceCategory !== undefined) return referenceCategory

  if (
    params.raw.form === "nil" ||
    params.raw.form === "typedEmpty" ||
    params.raw.form === "untypedEmpty"
  ) {
    return params.typedValue?.type === "string" && params.typedValue.value === ""
      ? "initial"
      : "xmlEmpty"
  }

  if (semanticClassification?.kind === "implicit") return "initial"
  return params.typedValue === undefined ? "unparsed" : "explicit"
}

function classifyReference(
  value: FillValueTypedValue | undefined,
  raw: RawFillValue,
): ValueCategory | undefined {
  if (value?.type !== "ref" || typeof value.value !== "string") return undefined
  if (value.value === "" || value.value.endsWith(".EmptyRef")) return "emptyRef"
  if (value.value.startsWith("Enum.") && value.value.includes(".EnumValue.")) return "enumValue"
  if (raw.xsiType === "xr:DesignTimeRef") return "predefinedRef"
  return "concreteRef"
}

function normalizeAlternative(alternative: FillValueAlternative): NormalizedTypeAlternative {
  switch (alternative.kind) {
    case "string": return { kind: "string", ...optionalEntries(alternative, ["length", "allowedLength"] as const) }
    case "number": return { kind: "number", ...optionalEntries(alternative, ["digits", "fractionDigits", "allowedSign"] as const) }
    case "boolean": return { kind: "boolean" }
    case "dateTime": return { kind: "dateTime", dateFractions: alternative.dateFractions }
    case "reference": return {
      kind: "reference",
      roots: [...(alternative.constraint.roots ?? [])].sort(),
      ...(alternative.objectName === undefined ? {} : { objectName: alternative.objectName }),
    }
  }
}

function optionalEntries<Source extends object, Key extends keyof Source>(
  source: Source,
  keys: readonly Key[],
): Partial<Pick<Source, Key>> {
  return Object.fromEntries(
    keys.flatMap((key) => source[key] === undefined ? [] : [[key, source[key]]]),
  ) as Partial<Pick<Source, Key>>
}

function alternativeSignature(alternative: NormalizedTypeAlternative): string {
  switch (alternative.kind) {
    case "string": return signatureWithProperties("string", alternative, ["length", "allowedLength"])
    case "number": return signatureWithProperties("number", alternative, ["digits", "fractionDigits", "allowedSign"])
    case "boolean": return "boolean"
    case "dateTime": return `dateTime(${alternative.dateFractions})`
    case "reference": {
      const roots = alternative.roots.join("|")
      return `reference(${roots}${alternative.objectName === undefined ? "" : `.${alternative.objectName}`})`
    }
  }
}

function signatureWithProperties(
  kind: string,
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): string {
  const properties = keys.flatMap((key) => value[key] === undefined ? [] : [`${key}=${String(value[key])}`])
  return properties.length === 0 ? kind : `${kind}(${properties.join(",")})`
}
