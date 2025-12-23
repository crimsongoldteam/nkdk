import { v4 } from "uuid"
import {
  GeneratedType,
  GeneratedTypeCategory,
  MetadataCatalog,
  MetadataCatalogXML,
} from "~/lib/metadata/appliedObjects/metadataCatalog/types"
import { exportMetadataCommandsToXML } from "~/lib/metadata/appliedObjects/metadataCommand/exportToXML"
import { exportAdditionalIndexesToXML } from "~/lib/metadata/commonObjects/additionalIndex/exportToXML"
import { exportCharacteristicsDescriptionsToXML } from "~/lib/metadata/commonObjects/characteristicsDescription/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataFieldsToXML } from "~/lib/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataItemLinksToXML } from "~/lib/metadata/commonObjects/metadataItemLink/exportToXML"
import { exportPredefinedItemsToXML } from "~/lib/metadata/commonObjects/predifined/exportToXML"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportMetadataAttributesToXML } from "../../commonObjects/metadataAttribute/exportToXML"
import { MetadataAttributesXML } from "../../commonObjects/metadataAttribute/types"
import { MetadataCommandsXML } from "../metadataCommand/types"

export const exportMetadataCatalogToXML = (
  configurationSettings: ConfigurationSettings,
  data: MetadataCatalog | undefined
): MetadataCatalogXML | undefined => {
  if (!data) return undefined

  const generatedTypes: GeneratedType[] = []
  for (const category of GeneratedTypeCategory) {
    generatedTypes.push({
      "xr:GeneratedType": {
        _name: `Catalog${category}.${data.name}`,
        _category: category,
        "xr:TypeId": v4(),
        "xr:ValueId": v4(),
      },
    })
  }

  let attributes: MetadataAttributesXML | undefined
  if (data.attributes) {
    attributes = exportMetadataAttributesToXML(configurationSettings, data.attributes)
  }

  let commands: MetadataCommandsXML | undefined
  if (data.commands) {
    commands = exportMetadataCommandsToXML(configurationSettings, data.commands)
  }

  let childObjects: MetadataCatalogXML["Catalog"]["ChildObjects"] | undefined
  if (attributes || commands) {
    childObjects = {}
    if (attributes) {
      childObjects.Attribute = attributes
    }
    if (commands) {
      childObjects.Command = commands
    }
  }

  const result: MetadataCatalogXML = {
    _xmlns: "http://v8.1c.ru/8.3/MDClasses",
    "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
    "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
    "_xmlns:cmi": "http://v8.1c.ru/8.2/managed-application/cmi",
    "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
    "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
    "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
    "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
    "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
    "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
    "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
    "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
    "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
    "_xmlns:xpr": "http://v8.1c.ru/8.3/xcf/predef",
    "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
    "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
    "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
    _version: "2.20",
    Catalog: compactObject<MetadataCatalogXML["Catalog"]>({
      _uuid: v4(),
      InternalInfo: generatedTypes,
      Properties: compactObject<MetadataCatalogXML["Catalog"]["Properties"]>({
        AdditionalIndexes: exportAdditionalIndexesToXML(configurationSettings, data.additionalIndexes),
        Autonumbering: data.autonumbering,
        AuxiliaryChoiceForm: data.auxiliaryChoiceForm,
        AuxiliaryFolderChoiceForm: data.auxiliaryFolderChoiceForm,
        AuxiliaryFolderForm: data.auxiliaryFolderForm,
        AuxiliaryListForm: data.auxiliaryListForm,
        AuxiliaryObjectForm: data.auxiliaryObjectForm,
        BasedOn: exportMetadataItemLinksToXML(configurationSettings, data.basedOn),
        Characteristics: exportCharacteristicsDescriptionsToXML(configurationSettings, data.characteristics),
        CheckUnique: data.checkUnique,
        ChoiceDataGetModeOnInputByString: data.choiceDataGetModeOnInputByString,
        ChoiceHistoryOnInput: data.choiceHistoryOnInput,
        ChoiceMode: data.choiceMode,
        CodeAllowedLength: data.codeAllowedLength,
        CodeLength: data.codeLength,
        CodeSeries: data.codeSeries,
        CodeType: data.codeType,
        Comment: data.comment,
        CreateOnInput: data.createOnInput,
        DataHistory: data.dataHistory,
        DataLockControlMode: data.dataLockControlMode,
        DataLockFields: exportMetadataFieldsToXML(configurationSettings, data.dataLockFields),
        DefaultChoiceForm: data.defaultChoiceForm,
        DefaultFolderChoiceForm: data.defaultFolderChoiceForm,
        DefaultFolderForm: data.defaultFolderForm,
        DefaultListForm: data.defaultListForm,
        DefaultObjectForm: data.defaultObjectForm,
        DefaultPresentation: data.defaultPresentation,
        DescriptionLength: data.descriptionLength,
        EditType: data.editType,
        ExecuteAfterWriteDataHistoryVersionProcessing: data.executeAfterWriteDataHistoryVersionProcessing,
        Explanation: exportI8nTextToXML(configurationSettings, data.explanation),
        ExtendedListPresentation: exportI8nTextToXML(configurationSettings, data.extendedListPresentation),
        ExtendedObjectPresentation: exportI8nTextToXML(configurationSettings, data.extendedObjectPresentation),
        FoldersOnTop: data.foldersOnTop,
        FullTextSearch: data.fullTextSearch,
        FullTextSearchOnInputByString: data.fullTextSearchOnInputByString,
        Hierarchical: data.hierarchical,
        HierarchyType: data.hierarchyType,
        IncludeHelpInContents: data.includeHelpInContents,
        InputByString: exportMetadataFieldsToXML(configurationSettings, data.inputByString),
        LevelCount: data.levelCount,
        LimitLevelCount: data.limitLevelCount,
        ListPresentation: exportI8nTextToXML(configurationSettings, data.listPresentation),
        Name: data.name!,
        ObjectBelonging: data.objectBelonging,
        ObjectPresentation: exportI8nTextToXML(configurationSettings, data.objectPresentation),
        Owners: exportMetadataItemLinksToXML(configurationSettings, data.owners),
        Predefined: exportPredefinedItemsToXML(configurationSettings, data.predefined),
        PredefinedDataUpdate: data.predefinedDataUpdate,
        QuickChoice: data.quickChoice,
        SearchStringModeOnInputByString: data.searchStringModeOnInputByString,
        StandardAttributes: exportStandardAttributeDescriptionsToXML(configurationSettings, data.standardAttributes),
        SubordinationUse: data.subordinationUse,
        Synonym: exportI8nTextToXML(configurationSettings, data.synonym),
        UpdateDataHistoryImmediatelyAfterWrite: data.updateDataHistoryImmediatelyAfterWrite,
        UseStandardCommands: data.useStandardCommands,
      })!,
      ChildObjects: childObjects,
    }),
  }

  return result
}
