import type { FillValueObservation, ValueCategory } from "./model"

export function referenceObservation(params: {
  readonly configuration: string
  readonly file: string
  readonly attributeName: string
  readonly value: string
  readonly valueCategory: Extract<ValueCategory, "emptyRef" | "predefinedRef" | "enumValue" | "concreteRef">
}): FillValueObservation {
  return {
    configuration: params.configuration,
    file: params.file,
    ownerKind: "Catalog",
    ownerName: "Контрагенты",
    attributeKind: "ordinary",
    attributeName: params.attributeName,
    itemKind: "Attribute",
    type: {
      source: "xml",
      family: "reference",
      signature: "reference(Catalog.Контрагенты)",
      alternatives: [{ kind: "reference", roots: ["Catalog"], objectName: "Контрагенты" }],
    },
    raw: { form: "typedText", xsiType: "xr:DesignTimeRef", text: params.value },
    typedValue: { type: "ref", value: params.value },
    valueCategory: params.valueCategory,
    rulesClassification: params.valueCategory === "emptyRef" ? "implicit" : "explicit",
  }
}
