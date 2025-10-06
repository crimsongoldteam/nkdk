import exportInputFieldToXML from "../inputField/exportToXML"
import { TClientApplicationForm, TClientApplicationFormXML } from "./types"

export default function exportClientApplicationFormToXML(element: TClientApplicationForm): TClientApplicationFormXML {
  const result: TClientApplicationFormXML = {
    Form: {
      _xmlns: "http://v8.1c.ru/8.3/xcf/logform",
      "_xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
      "_xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
      "_xmlns:dcscor": "http://v8.1c.ru/8.1/data-composition-system/core",
      "_xmlns:dcssch": "http://v8.1c.ru/8.1/data-composition-system/schema",
      "_xmlns:dcsset": "http://v8.1c.ru/8.1/data-composition-system/settings",
      "_xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
      "_xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
      "_xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
      "_xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
      "_xmlns:v8": "http://v8.1c.ru/8.1/data/core",
      "_xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
      "_xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
      "_xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
      "_xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
      "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
      "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      _version: "2.20",

      ChildItems: element.items.map((item) => exportInputFieldToXML(item)),
    },
  }
  return result
}
