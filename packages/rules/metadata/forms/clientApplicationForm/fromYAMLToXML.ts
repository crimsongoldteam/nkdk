import type { LocalConfigurationIndexReader } from "@nkdk/runtime"
import "../../commonObjects"
import { buildClientApplicationBaseForm } from "./baseForm"
import { convertClientApplicationFormYAMLToXMLCore } from "./convertYAMLToXML"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormXML, ClientApplicationFormYAML } from "./types"
import type { SelectedBaseYAMLInput } from "@nkdk/runtime/rule-kit"
import type { YAMLToXMLNestedRule } from "@nkdk/runtime/rule-kit"
import { createFormXmlIdAssignmentSession } from "./formXmlIdAssignment"

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
    ownerYAML,
    annotations,
    baseYAML,
    baseYAMLContext,
    baseConfigurationIndex,
    name,
    referenceXML,
  }) => {
    const rule = ClientApplicationFormRules
    const extensionYaml = (yaml ?? {}) as ClientApplicationFormYAML
    const owner = (ownerYAML ?? {}) as ClientApplicationFormYAML
    if (extensionYaml.ТипФормы === "Обычная" || owner.ТипФормы === "Обычная") return undefined
    const selectedBase = selectedBaseYAMLInput(baseYAML)
    const baseFormYAML = selectedBase?.baseFormYAML ?? baseYAML
    const referenceForm = referenceXML?.Form as ClientApplicationFormXML | undefined
    const xmlIdSession = createFormXmlIdAssignmentSession({
      references: [referenceForm],
    })
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
            referenceFormXML: referenceForm?.BaseForm as ClientApplicationFormXML | undefined,
            rule,
            xmlIdSession,
          })
    return {
      Form: convertClientApplicationFormYAMLToXMLCore({
        context,
        yaml: extensionYaml,
        name,
        referenceFormXML: referenceForm,
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
        xmlIdSession,
        annotations,
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
