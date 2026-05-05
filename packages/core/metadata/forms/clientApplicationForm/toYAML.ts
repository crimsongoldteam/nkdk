import { ConfigurationContext, ExternalFileEntry } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "~/metadata/orchestration"
import { exportChildItemsToPartialYAML } from "../commonObjects/childItems/toYAML"
import { getAllElements } from "./getAllElements"
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
        },
      }
    : context

  const properties = exportPropertiesToYAML({
    context: contextWithCollector,
    data: data,
    rule: ClientApplicationFormRules,
  })

  const allElements = getAllElements(data)
  const childItemsPartial = exportChildItemsToPartialYAML(contextWithCollector, allElements)

  const yaml: ClientApplicationFormYAML = {
    ...properties,
    ...(childItemsPartial ? { Элементы: childItemsPartial } : {}),
  }

  return { yaml, externalFiles: externalFilesCollector }
}
