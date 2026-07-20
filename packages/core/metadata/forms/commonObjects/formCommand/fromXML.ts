import { ConfigurationContextFromXML } from "../../../context/types"
import { importMetadataItemFromXML } from "../../../orchestration/metadataItem/fromXML"
import type { PropertyRule } from "../../../orchestration/property/types"
import type { ButtonRepresentation } from "../../../systemEnumerations/types"
import { FormCommandRules } from "./rules"
import type { FormCommand, FormCommands, FormCommandXML, FormCommandsXML } from "./types"
import { childUid } from "../../../configurationIndex/logicalAddress"
import {
  getConfigurationIndexCollectionContext,
  withConfigurationIndexLogicalAddress,
} from "../../../configurationIndex/collector/context"

export const importFormCommandsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: { Command: FormCommandsXML } | undefined
): FormCommands | undefined => {
  if (!xml?.Command) return undefined
  const items = Array.isArray(xml.Command) ? xml.Command : [xml.Command]
  const collection = getConfigurationIndexCollectionContext(context)
  const result = items
    .map((item: FormCommandXML) => {
      const commandContext =
        collection !== undefined && typeof item._name === "string"
          ? withConfigurationIndexLogicalAddress(context, childUid(collection.logicalAddress, "Команда", item._name))
          : context
      const properties = importMetadataItemFromXML({ context: commandContext, xml: item, rule: FormCommandRules })
      if (properties === undefined) return undefined

      const command = {
        ...properties,
        ...(item._name === undefined ? {} : { name: item._name }),
      } as FormCommand
      for (const key of Object.getOwnPropertyNames(properties)) {
        const descriptor = Object.getOwnPropertyDescriptor(properties, key)
        if (descriptor?.enumerable === false) Object.defineProperty(command, key, descriptor)
      }
      return command
    })
    .filter((command): command is FormCommand => command !== undefined)

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
