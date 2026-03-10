import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ElementXML, exportPropertiesToXML, registerTypeRule } from "~/metadata/orchestration"
import { FormCommandRules } from "./rules"
import { FormCommand, FormCommandXML, FormCommands } from "./types"

export const exportCommandsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  data: FormCommands | undefined,
  referenceData?: FormCommands | undefined
): { Command: ElementXML[] } | undefined => {
  if (!data || data.length === 0) return undefined

  const result = data.map((command) => {
    const referenceCommand = findReferenceCommand(command, referenceData)
    return exportCommandToXML(context, command, referenceCommand)
  })

  return { Command: result }
}

const exportCommandToXML = (
  context: ConfigurationContextWithExportToXML,
  data: FormCommand,
  referenceData?: FormCommand
): FormCommandXML => {
  // const id = getElementId(context)

  const properties = exportPropertiesToXML({
    context,
    metadata: data,
    referenceMetadata: referenceData,
    rule: FormCommandRules,
  })

  const { Name: _skipName, ...rest } = properties as Record<string, unknown>
  const result: FormCommandXML = {
    _name: data.name,
    _id: "",
    ...rest,
  } as FormCommandXML

  context.exportToXML?.context?.metadataForNumbering.push({
    element: data,
    referenceElement: referenceData,
    xmlElement: result,
  })

  return result
}

const findReferenceCommand = (data: FormCommand, referenceData: FormCommands | undefined): FormCommand | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((referenceItem) => referenceItem.name === data.name)
}

registerTypeRule("FormCommands", "exportToXML", exportCommandsToXML)
