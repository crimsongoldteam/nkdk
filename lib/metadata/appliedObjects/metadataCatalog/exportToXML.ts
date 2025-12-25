import { v4 } from "uuid"
import {
  CatalogInternalInfoParamsXML,
  MetadataCatalog,
  MetadataCatalogXML,
} from "~/lib/metadata/appliedObjects/metadataCatalog/types"
import { exportMetadataCommandsToXML } from "~/lib/metadata/appliedObjects/metadataCommand/exportToXML"
import { exportAdditionalIndexesToXML } from "~/lib/metadata/commonObjects/additionalIndex/exportToXML"
import { exportCharacteristicsDescriptionsToXML } from "~/lib/metadata/commonObjects/characteristicsDescription/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportMetadataFieldsToXML } from "~/lib/metadata/commonObjects/metadataField/exportToXML"
import { exportMetadataItemLinksToXML } from "~/lib/metadata/commonObjects/metadataRef/exportToXML"
import { exportPredefinedItemsToXML } from "~/lib/metadata/commonObjects/predifined/exportToXML"
import { exportStandardAttributeDescriptionsToXML } from "~/lib/metadata/commonObjects/standardAttributeDescription/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { exportInternalInfoToXML } from "../../commonObjects/internalInfo/exportToXML"
import { exportMetadataAttributesToXML } from "../../commonObjects/metadataAttribute/exportToXML"
import { MetadataAttributesXML } from "../../commonObjects/metadataAttribute/types"
import { MetadataCommandsXML } from "../metadataCommand/types"
import { getDefaults } from "./defaults"

export const exportMetadataCatalogToXML = (
  context: Context,
  data: MetadataCatalog | undefined
): MetadataCatalogXML | undefined => {
  if (!data) return undefined

  const defaults = getDefaults(data, context)
  const mergedData = { ...defaults, ...data }

  const internalInfo = exportInternalInfoToXML<CatalogInternalInfoParamsXML>([
    { name: `CatalogObject.${mergedData.name}`, category: "Object" },
    { name: `CatalogRef.${mergedData.name}`, category: "Ref" },
    { name: `CatalogSelection.${mergedData.name}`, category: "Selection" },
    { name: `CatalogList.${mergedData.name}`, category: "List" },
    { name: `CatalogManager.${mergedData.name}`, category: "Manager" },
  ])

  let attributes: MetadataAttributesXML | undefined
  if (mergedData.attributes) {
    attributes = exportMetadataAttributesToXML(context, mergedData.attributes)
  }

  let commands: MetadataCommandsXML | undefined
  if (mergedData.commands) {
    commands = exportMetadataCommandsToXML(context, mergedData.commands)
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
      InternalInfo: internalInfo,
      Properties: compactObject<MetadataCatalogXML["Catalog"]["Properties"]>({
        AdditionalIndexes: exportAdditionalIndexesToXML(context, mergedData.additionalIndexes),
        Autonumbering: mergedData.autonumbering,
        AuxiliaryChoiceForm: mergedData.auxiliaryChoiceForm,
        AuxiliaryFolderChoiceForm: mergedData.auxiliaryFolderChoiceForm,
        AuxiliaryFolderForm: mergedData.auxiliaryFolderForm,
        AuxiliaryListForm: mergedData.auxiliaryListForm,
        AuxiliaryObjectForm: mergedData.auxiliaryObjectForm,
        BasedOn: exportMetadataItemLinksToXML(context, mergedData.basedOn),
        Characteristics: exportCharacteristicsDescriptionsToXML(context, mergedData.characteristics),
        CheckUnique: mergedData.checkUnique,
        ChoiceDataGetModeOnInputByString: mergedData.choiceDataGetModeOnInputByString,
        ChoiceHistoryOnInput: mergedData.choiceHistoryOnInput,
        ChoiceMode: mergedData.choiceMode,
        CodeAllowedLength: mergedData.codeAllowedLength,
        CodeLength: mergedData.codeLength,
        CodeSeries: mergedData.codeSeries,
        CodeType: mergedData.codeType,
        Comment: mergedData.comment,
        CreateOnInput: mergedData.createOnInput,
        DataHistory: mergedData.dataHistory,
        DataLockControlMode: mergedData.dataLockControlMode,
        DataLockFields: exportMetadataFieldsToXML(context, mergedData.dataLockFields),
        DefaultChoiceForm: mergedData.defaultChoiceForm,
        DefaultFolderChoiceForm: mergedData.defaultFolderChoiceForm,
        DefaultFolderForm: mergedData.defaultFolderForm,
        DefaultListForm: mergedData.defaultListForm,
        DefaultObjectForm: mergedData.defaultObjectForm,
        DefaultPresentation: mergedData.defaultPresentation,
        DescriptionLength: mergedData.descriptionLength,
        EditType: mergedData.editType,
        ExecuteAfterWriteDataHistoryVersionProcessing: mergedData.executeAfterWriteDataHistoryVersionProcessing,
        Explanation: exportI8nTextToXML(context, mergedData.explanation),
        ExtendedListPresentation: exportI8nTextToXML(context, mergedData.extendedListPresentation),
        ExtendedObjectPresentation: exportI8nTextToXML(context, mergedData.extendedObjectPresentation),
        FoldersOnTop: mergedData.foldersOnTop,
        FullTextSearch: mergedData.fullTextSearch,
        FullTextSearchOnInputByString: mergedData.fullTextSearchOnInputByString,
        Hierarchical: mergedData.hierarchical,
        HierarchyType: mergedData.hierarchyType,
        IncludeHelpInContents: mergedData.includeHelpInContents,
        InputByString: exportMetadataFieldsToXML(context, mergedData.inputByString),
        LevelCount: mergedData.levelCount,
        LimitLevelCount: mergedData.limitLevelCount,
        ListPresentation: exportI8nTextToXML(context, mergedData.listPresentation),
        Name: mergedData.name!,
        ObjectBelonging: mergedData.objectBelonging,
        ObjectPresentation: exportI8nTextToXML(context, mergedData.objectPresentation),
        Owners: exportMetadataItemLinksToXML(context, mergedData.owners),
        Predefined: exportPredefinedItemsToXML(context, mergedData.predefined),
        PredefinedDataUpdate: mergedData.predefinedDataUpdate,
        QuickChoice: mergedData.quickChoice,
        SearchStringModeOnInputByString: mergedData.searchStringModeOnInputByString,
        StandardAttributes: exportStandardAttributeDescriptionsToXML(context, mergedData.standardAttributes),
        SubordinationUse: mergedData.subordinationUse,
        Synonym: exportI8nTextToXML(context, mergedData.synonym),
        UpdateDataHistoryImmediatelyAfterWrite: mergedData.updateDataHistoryImmediatelyAfterWrite,
        UseStandardCommands: mergedData.useStandardCommands,
      })!,
      ChildObjects: childObjects,
    }),
  }

  return result
}
