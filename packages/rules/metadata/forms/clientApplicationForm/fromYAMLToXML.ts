import type { LocalConfigurationIndexReader } from "@nkdk/runtime"
import "../../commonObjects"
import { buildClientApplicationBaseForm } from "./baseForm"
import { convertClientApplicationFormYAMLToXMLCore } from "./convertYAMLToXML"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, ClientApplicationFormYAML } from "./types"
import type { SelectedBaseYAMLInput } from "@nkdk/runtime/rule-kit"
import type { YAMLToXMLNestedRule } from "@nkdk/runtime/rule-kit"

export const convertClientApplicationFormFromYAMLToXML =
  convertClientApplicationFormYAMLToXMLCore
export type {
  ConvertClientApplicationFormFromYAMLToXMLParams,
  DirectClientApplicationFormXMLResult,
} from "./convertYAMLToXML"

export const clientApplicationFormYamlToXmlNestedRule: Extract<
  YAMLToXMLNestedRule,
  { readonly kind: "externalFile" }
> = {
  kind: "externalFile",
  convert: ({
    context,
    yaml,
    baseYAML,
    baseYAMLContext,
    baseConfigurationIndex,
    name,
    referenceXML,
  }) => {
    const rule = ClientApplicationFormRules
    const extensionYaml = yaml as ClientApplicationFormYAML
    const selectedBase = selectedBaseYAMLInput(baseYAML)
    const baseFormYAML = selectedBase?.baseFormYAML ?? baseYAML
    const baseFormXML =
      baseFormYAML === undefined
        ? undefined
        : buildClientApplicationBaseForm({
            context: baseYAMLContext ?? context,
            ...(baseYAMLContext === undefined
              ? {
                  baseIndex: requireBaseConfigurationIndex(baseConfigurationIndex),
                  extensionYaml,
                }
              : {}),
            baseYaml: baseFormYAML as ClientApplicationFormYAML,
            ...(selectedBase === undefined
              ? {}
              : {
                  currentConfigurationFormYaml:
                    selectedBase.currentConfigurationFormYAML as ClientApplicationFormYAML,
                }
            ),
            formName: name,
            rule,
          })
    return {
      Form: convertClientApplicationFormYAMLToXMLCore({
        context,
        yaml: extensionYaml,
        name,
        referenceFormXML: referenceXML?.Form as ClientApplicationFormXML | undefined,
        ...(baseFormXML === undefined ? {} : { baseFormXML }),
        ...(selectedBase === undefined
          ? baseYAMLContext === undefined && baseFormYAML !== undefined
            ? { currentConfigurationFormYaml: baseFormYAML as ClientApplicationFormYAML }
            : {}
          : {
              currentConfigurationFormYaml:
                selectedBase.currentConfigurationFormYAML as ClientApplicationFormYAML,
              ...(selectedBase.baseFormSourceKind === "saved"
                ? { savedBaseFormYaml: selectedBase.baseFormYAML as ClientApplicationFormYAML }
                : {}),
            }),
        rule,
      }).formXML,
    }
  },
}

function selectedBaseYAMLInput(value: unknown): SelectedBaseYAMLInput | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined
  const input = value as Partial<SelectedBaseYAMLInput>
  return input.kind === "selectedBaseYAML" &&
    (input.baseFormSourceKind === "saved" || input.baseFormSourceKind === "projected")
    ? input as SelectedBaseYAMLInput
    : undefined
}

function requireBaseConfigurationIndex(
  baseConfigurationIndex: LocalConfigurationIndexReader | undefined
): LocalConfigurationIndexReader {
  if (baseConfigurationIndex !== undefined) return baseConfigurationIndex
  throw new Error("Для построения BaseForm не передан индекс основной конфигурации")
}
