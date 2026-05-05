import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FormCommandRules } from "./rules"
import { FormCommand, FormCommands, FormCommandsXML } from "./types"

const importFormCommandsDefaultFromXML = importMetadataItemCollectionFromXML(FormCommandRules, "Command")

export const importFormCommandsFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: { Command: FormCommandsXML } | undefined
): FormCommands | undefined => {
  const result = importFormCommandsDefaultFromXML(context, rule, xml) as FormCommands | undefined

  return result?.map((command: FormCommand) => {
    const representation = command.representation as string | undefined
    if (representation === undefined) {
      return command
    }

    return {
      ...command,
      representation: representation === "TextPicture" ? "PictureAndText" : representation,
    }
  })
}
