import { metadataRuleLayer000 as layer0 } from "./autoCommandBar/rules"
import { metadataRuleLayer001 as layer1 } from "./autoCommandBar/rules"
import { metadataRuleLayer002 as layer2 } from "./autoCommandBar/rules"
import { metadataRuleLayer000 as layer3 } from "./button/rules"
import { metadataRuleLayer001 as layer4 } from "./button/rules"
import { metadataRuleLayer000 as layer5 } from "./buttonGroup/rules"
import { metadataRuleLayer000 as layer6 } from "./calendarField/rules"
import { metadataRuleLayer000 as layer7 } from "./chartField/rules"
import { metadataRuleLayer000 as layer8 } from "./columnGroup/rules"
import { metadataRuleLayer000 as layer9 } from "./commandBar/rules"
import { metadataRuleLayer000 as layer10 } from "./contextMenu/rules"
import { metadataRuleLayer001 as layer11 } from "./contextMenu/rules"
import { metadataRuleLayer000 as layer12 } from "./dendrogramField/rules"
import { metadataRuleLayer000 as layer13 } from "./extendedTooltip/rules"
import { metadataRuleLayer001 as layer14 } from "./extendedTooltip/rules"
import { metadataRuleLayer000 as layer15 } from "./formattedDocumentField/rules"
import { metadataRuleLayer000 as layer16 } from "./ganttChartField/rules"
import { metadataRuleLayer000 as layer17 } from "./geographicalSchemaField/rules"
import { metadataRuleLayer000 as layer18 } from "./graphicalSchemaField/rules"
import { metadataRuleLayer000 as layer19 } from "./htmlDocumentField/rules"
import { metadataRuleLayer000 as layer20 } from "./labelDecoration/rules"
import { metadataRuleLayer000 as layer21 } from "./page/rules"
import { metadataRuleLayer000 as layer22 } from "./pages/rules"
import { metadataRuleLayer000 as layer23 } from "./pdfDocumentField/rules"
import { metadataRuleLayer000 as layer24 } from "./periodField/rules"
import { metadataRuleLayer000 as layer25 } from "./pictureDecoration/rules"
import { metadataRuleLayer000 as layer26 } from "./plannerField/rules"
import { metadataRuleLayer000 as layer27 } from "./popup/rules"
import { metadataRuleLayer000 as layer28 } from "./progressBarField/rules"
import { metadataRuleLayer000 as layer29 } from "./radioButtonField/rules"
import { metadataRuleLayer000 as layer30 } from "./searchControlAddition/rules"
import { metadataRuleLayer001 as layer31 } from "./searchControlAddition/rules"
import { metadataRuleLayer002 as layer32 } from "./searchControlAddition/rules"
import { metadataRuleLayer000 as layer33 } from "./searchStringAddition/rules"
import { metadataRuleLayer001 as layer34 } from "./searchStringAddition/rules"
import { metadataRuleLayer002 as layer35 } from "./searchStringAddition/rules"
import { metadataRuleLayer000 as layer36 } from "./spreadSheetDocumentField/rules"
import { metadataRuleLayer000 as layer37 } from "./table/rules"
import { metadataRuleLayer000 as layer38 } from "./textDocumentField/rules"
import { metadataRuleLayer000 as layer39 } from "./trackBarField/rules"
import { metadataRuleLayer000 as layer40 } from "./usualGroup/rules"
import { metadataRuleLayer000 as layer41 } from "./viewStatusAddition/rules"
import { metadataRuleLayer001 as layer42 } from "./viewStatusAddition/rules"
import { metadataRuleLayer002 as layer43 } from "./viewStatusAddition/rules"
import { metadataPropertyRule000 as ganttProperty0 } from "../commonObjects/ganttChartFieldTable/types"
import { metadataPropertyRule001 as ganttProperty1 } from "../commonObjects/ganttChartFieldTable/types"
import { metadataPropertyRule002 as ganttProperty2 } from "../commonObjects/ganttChartFieldTable/types"
import { metadataPropertyRule003 as ganttProperty3 } from "../commonObjects/ganttChartFieldTable/types"
import { metadataPropertyRule004 as ganttProperty4 } from "../commonObjects/ganttChartFieldTable/types"

import { composeMetadataRules, defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { propertyTypesFromContributions } from "../../ruleRuntime/property/propertyRuleRegistrySet"

const ganttChartFieldTableRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions([
    ganttProperty0,
    ganttProperty1,
    ganttProperty2,
    ganttProperty3,
    ganttProperty4,
  ]),
})

export const formElementRules = composeMetadataRules(
  layer0,
  layer1,
  layer2,
  layer3,
  layer4,
  layer5,
  layer6,
  layer7,
  layer8,
  layer9,
  layer10,
  layer11,
  layer12,
  layer13,
  layer14,
  layer15,
  layer16,
  layer17,
  layer18,
  layer19,
  layer20,
  layer21,
  layer22,
  layer23,
  layer24,
  layer25,
  layer26,
  layer27,
  layer28,
  layer29,
  layer30,
  layer31,
  layer32,
  layer33,
  layer34,
  layer35,
  layer36,
  layer37,
  layer38,
  layer39,
  layer40,
  layer41,
  layer42,
  layer43,
  ganttChartFieldTableRules,
)
