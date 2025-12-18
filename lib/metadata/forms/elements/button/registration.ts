import { registerFormat } from "~/lib/format/formatFactory"
import { registerIsOneLineElementCheck } from "~/lib/format/isOneLineElementCheckFactory"
import { FormElementType } from "../../../metadataFactory/types"
import { Button } from "./types"
import { formatButton } from "./format"

registerFormat<Button>(formatButton, (element: Button) => element.elementType === FormElementType.Button)
registerIsOneLineElementCheck<Button>(FormElementType.Button, () => true)
