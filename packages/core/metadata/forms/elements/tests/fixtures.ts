import { InputField } from "nkdk-language"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { CollectableElement, ToNKDKResult } from "~/metadata/orchestration"
import { exportInputFieldToNKDK } from "../inputField/toNKDK"
import { InputField as InputFieldModel } from "../inputField/types"
import {
  fullInputField,
  fullInputFieldEnterprise,
  fullInputFieldPartialYAML,
  minimalInputField,
  minimalInputFieldEnterprise,
} from "../inputField/__fixtures__/data"

type ToNKDKFn = (params: { context: ConfigurationContext; element: CollectableElement }) => ToNKDKResult

type ElementFixture = {
  group: string
  name: string
  element: Element
  xml: string
  model: object
  yaml: object | undefined
  enterprise: object
  nkdk?: ToNKDKResult
  toNKDKFn?: ToNKDKFn
}

export const ElementFixtures: ElementFixture[] = [
  {
    group: "InputField",
    name: "all fields",
    element: InputField,
    xml: "full.xml",
    model: fullInputField,
    yaml: fullInputFieldPartialYAML,
    enterprise: fullInputFieldEnterprise,
    nkdk: { strings: ['"Поле ввода": ПолеВвода(Реквизит)'], toOneLineGroup: true },
    toNKDKFn: ({ context, element }) =>
      exportInputFieldToNKDK({ context, element: element as unknown as InputFieldModel }),
  },
  {
    group: "InputField",
    name: "minimal fields",
    element: InputField,
    xml: "minimal.xml",
    model: minimalInputField,
    yaml: undefined,
    enterprise: minimalInputFieldEnterprise,
    nkdk: { strings: ["ПолеВвода(): "], toOneLineGroup: true },
    toNKDKFn: ({ context, element }) =>
      exportInputFieldToNKDK({ context, element: element as unknown as InputFieldModel }),
  },
]

export const groupedFixtures = ElementFixtures.reduce(
  (acc, fixture) => {
    acc[fixture.group] = [...(acc[fixture.group] || []), fixture]
    return acc
  },
  {} as Record<string, ElementFixture[]>
)
