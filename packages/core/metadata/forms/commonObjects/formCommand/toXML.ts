import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew, exportPropertiesToXML } from "~/metadata/orchestration"
import { FormCommandRules } from "./rules"
import type { FormCommand, FormCommands, FormCommandXML } from "./types"

export const exportFormCommandsToXML: ExportToXMLFunctionNew = (params): { Command: FormCommandXML[] } | undefined => {
  const context = params.context as ConfigurationContextWithExportToXML
  const data = params.value as FormCommands | undefined
  const referenceData = params.referenceMetadata as FormCommands | undefined

  if (data === undefined || data === null) return undefined
  if (data.length === 0) return { Command: [] }

  const result = data.map((command) => exportFormCommandToXML(context, command, findReferenceCommand(command, referenceData)))

  return { Command: result }
}

const exportFormCommandToXML = (
  context: ConfigurationContextWithExportToXML,
  data: FormCommand,
  referenceData?: FormCommand
): FormCommandXML => {
  const result: FormCommandXML = {
    _name: data.name,
    _id: data.id ?? "",
  }

  context.exportToXML?.context?.metadataForNumbering.push({
    element: data,
    referenceElement: referenceData,
    xmlElement: result,
  })

  const properties = exportPropertiesToXML({
    context,
    metadata: data,
    referenceMetadata: referenceData ?? data,
    rule: FormCommandRules,
  })

  Object.assign(result, properties)

  if (result.Representation === "PictureAndText") {
    result.Representation = "TextPicture"
  }

  return result
}

const findReferenceCommand = (data: FormCommand, referenceData: FormCommands | undefined): FormCommand | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((referenceItem) => referenceItem.name === data.name)
}
