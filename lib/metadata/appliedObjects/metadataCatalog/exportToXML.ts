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
import { exportMetadataAttributesToXML } from "~/lib/metadata/commonObjects/metadataAttribute/exportToXML"
import { exportMetadataFieldsToXML } from "~/lib/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataItemLinksToXML } from "~/lib/metadata/commonObjects/metadataItemLink/exportToXML"
import { exportMetadataTabularSectionsToXML } from "~/lib/metadata/commonObjects/metadataTabularSection/exportToXML"
import { exportPredefinedItemsToXML } from "~/lib/metadata/commonObjects/predifined/exportToXML"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"

export const exportMetadataCatalogToXML = (
  data: MetadataCatalog | undefined,
  configurationSettings: ConfigurationSettings
): MetadataCatalogXML | undefined => {
  if (!data) return undefined

  const generatedTypes: GeneratedType[] = []
  for (const category of GeneratedTypeCategory) {
    generatedTypes.push({
      _name: `Catalog${category}.${data.name}`,
      _category: category,
      "xr:TypeId": v4(),
      "xr:ValueId": v4(),
    })
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
    Catalog: {
      _uuid: v4(),
      InternalInfo: {
        "xr:GeneratedType": generatedTypes,
      },
      Properties: compactObject({
        AdditionalIndexes: exportAdditionalIndexesToXML(data.additionalIndexes, configurationSettings),
        Attributes: exportMetadataAttributesToXML(data.attributes, configurationSettings),
        Autonumbering: data.autonumbering,
        AuxiliaryChoiceForm: data.auxiliaryChoiceForm,
        AuxiliaryFolderChoiceForm: data.auxiliaryFolderChoiceForm,
        AuxiliaryFolderForm: data.auxiliaryFolderForm,
        AuxiliaryListForm: data.auxiliaryListForm,
        AuxiliaryObjectForm: data.auxiliaryObjectForm,
        BasedOn: exportMetadataItemLinksToXML(data.basedOn, configurationSettings),
        Characteristics: exportCharacteristicsDescriptionsToXML(data.characteristics, configurationSettings),
        CheckUnique: data.checkUnique,
        ChoiceDataGetModeOnInputByString: data.choiceDataGetModeOnInputByString,
        ChoiceHistoryOnInput: data.choiceHistoryOnInput,
        ChoiceMode: data.choiceMode,
        CodeAllowedLength: data.codeAllowedLength,
        CodeLength: data.codeLength,
        CodeSeries: data.codeSeries,
        CodeType: data.codeType,
        Commands: exportMetadataCommandsToXML(data.commands, configurationSettings),
        Comment: data.comment,
        CreateOnInput: data.createOnInput,
        DataHistory: data.dataHistory,
        DataLockControlMode: data.dataLockControlMode,
        DataLockFields: exportMetadataFieldsToXML(data.dataLockFields, configurationSettings),
        DefaultChoiceForm: data.defaultChoiceForm,
        DefaultFolderChoiceForm: data.defaultFolderChoiceForm,
        DefaultFolderForm: data.defaultFolderForm,
        DefaultListForm: data.defaultListForm,
        DefaultObjectForm: data.defaultObjectForm,
        DefaultPresentation: data.defaultPresentation,
        DescriptionLength: data.descriptionLength,
        EditType: data.editType,
        ExecuteAfterWriteDataHistoryVersionProcessing: data.executeAfterWriteDataHistoryVersionProcessing,
        Explanation: exportI8nTextToXML(data.explanation, configurationSettings),
        ExtendedListPresentation: exportI8nTextToXML(data.extendedListPresentation, configurationSettings),
        ExtendedObjectPresentation: exportI8nTextToXML(data.extendedObjectPresentation, configurationSettings),
        FoldersOnTop: data.foldersOnTop,
        FullTextSearch: data.fullTextSearch,
        FullTextSearchOnInputByString: data.fullTextSearchOnInputByString,
        Hierarchical: data.hierarchical,
        HierarchyType: data.hierarchyType,
        IncludeHelpInContents: data.includeHelpInContents,
        InputByString: exportMetadataFieldsToXML(data.inputByString, configurationSettings),
        LevelCount: data.levelCount,
        LimitLevelCount: data.limitLevelCount,
        ListPresentation: exportI8nTextToXML(data.listPresentation, configurationSettings),
        Name: data.name!,
        ObjectBelonging: data.objectBelonging,
        ObjectPresentation: exportI8nTextToXML(data.objectPresentation, configurationSettings),
        Owners: exportMetadataItemLinksToXML(data.owners, configurationSettings),
        Predefined: exportPredefinedItemsToXML(data.predefined, configurationSettings),
        PredefinedDataUpdate: data.predefinedDataUpdate,
        QuickChoice: data.quickChoice,
        SearchStringModeOnInputByString: data.searchStringModeOnInputByString,
        StandardAttributes: exportStandardAttributeDescriptionsToXML(data.standardAttributes, configurationSettings),
        SubordinationUse: data.subordinationUse,
        Synonym: exportI8nTextToXML(data.synonym, configurationSettings),
        TabularSections: exportMetadataTabularSectionsToXML(data.tabularSections, configurationSettings),
        UpdateDataHistoryImmediatelyAfterWrite: data.updateDataHistoryImmediatelyAfterWrite,
        UseStandardCommands: data.useStandardCommands,
      })!,
    },
  }

  return result
}
