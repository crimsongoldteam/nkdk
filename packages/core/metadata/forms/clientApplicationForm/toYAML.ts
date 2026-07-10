import { ConfigurationContext, ExternalFileEntry } from "../../context/types"
import { exportPropertiesToYAML } from "../../orchestration"
import { ClientApplicationFormRules } from "./rules"
import { ClientApplicationForm, ClientApplicationFormYAML } from "./types"

export type FormYAMLExportResult = {
  yaml: ClientApplicationFormYAML | undefined
  externalFiles: ExternalFileEntry[]
}

export const exportClientApplicationFormToYAML = (
  context: ConfigurationContext,
  data: ClientApplicationForm
): FormYAMLExportResult => {
  const externalFilesCollector: ExternalFileEntry[] = []

  const contextWithCollector: ConfigurationContext = context.exportToYAML
    ? {
        ...context,
        exportToYAML: {
          ...context.exportToYAML,
          externalFilesCollector,
          formAttributes: data.attributes,
        },
      }
    : context

  const yaml = exportPropertiesToYAML({
    context: contextWithCollector,
    data: data,
    rule: ClientApplicationFormRules,
  }) as ClientApplicationFormYAML | undefined

  return { yaml, externalFiles: externalFilesCollector }
}
