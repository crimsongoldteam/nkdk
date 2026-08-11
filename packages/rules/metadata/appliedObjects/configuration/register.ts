import "../metadataExternalDataSource/register"
import "../metadataSubsystem/register"
import { defineMetadataXmlPrepareCapability } from "../../resourceTopology/adapters/capabilities"
import { prepareConfigurationXML } from "./rootIO"
import { buildConfigurationChildObjectsFromProjectEntries } from "./childObjects"
import { configurationChildObjectsFromIndex } from "./configurationChildObjects"
import "./registerPartialXmlPackage"

export const configurationResourceCapabilityRules = defineMetadataXmlPrepareCapability({
  id: "configuration",
  run: ({ context, preparedYamlFile, assignment, logicalAddress, outputs, composition, profile }) => {
    const output = outputs.find((candidate) => candidate.role === "metadata")
    if (output === undefined) return []
    const currentChildObjects = buildConfigurationChildObjectsFromProjectEntries({
      entries: composition.children(logicalAddress)
        .filter((entry) => entry.assignmentRole === "properties")
        .map((entry) => {
          const parts = entry.sourceProjectPath.split("/")
          return { dir: parts[0] ?? "", name: parts[1] ?? entry.itemName }
        }),
    })
    const prepared = prepareConfigurationXML({
      context,
      preparedYamlFile,
      rootRule: assignment.itemRule,
      childObjects: configurationChildObjectsFromIndex(context.exportToXML.configurationIndex, currentChildObjects),
      profile,
    })
    return [{ declarationId: output.declarationId, targetXmlPath: output.targetXmlPath, ...prepared }]
  },
})
