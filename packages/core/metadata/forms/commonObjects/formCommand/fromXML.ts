import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { ButtonRepresentation } from "~/metadata/systemEnumerations/types"
import { FormCommandRules } from "./rules"
import type { FormCommand, FormCommands, FormCommandsXML } from "./types"

const importFormCommandsDefaultFromXML = importMetadataItemCollectionFromXML(FormCommandRules, "Command")

export const importFormCommandsFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: { Command: FormCommandsXML } | undefined
): FormCommands | undefined => {
  const result = importFormCommandsDefaultFromXML(context, rule, xml) as FormCommands | undefined

  return result?.map((command: FormCommand) => {
    const representation = command.representation as ButtonRepresentation | "TextPicture" | undefined
    if (representation === undefined) {
      return command
    }

    return {
      ...command,
      representation: representation === "TextPicture" ? "PictureAndText" : representation,
    }
  })
}
