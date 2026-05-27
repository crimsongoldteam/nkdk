import { describe, expect, it } from "vitest"
import {
  ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM,
  MASTER_SIMPLIFIED_CONNECTION_FORM,
  restoreKnownDuplicateCommandBarButtonIds,
  restoreKnownDuplicateErpAdditionalColumns,
} from "./knownAnomalies"

describe("known form XML anomalies", () => {
  it("restores ERP duplicate AdditionalColumns only for the known path/table/name", () => {
    const column = { _name: "Реквизит1", _id: "", Title: "Реквизит1" }

    expect(
      restoreKnownDuplicateErpAdditionalColumns({
        currentXMLPath: ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM,
        table: "Список.Способы",
        columnName: "Реквизит1",
        column,
      })
    ).toEqual([
      { _name: "Реквизит1", _id: "1", Title: "Реквизит1" },
      { _name: "Реквизит1", _id: "2", Title: "Реквизит1" },
      { _name: "Реквизит1", _id: "3", Title: "Реквизит1" },
      { _name: "Реквизит1", _id: "4", Title: "Реквизит1" },
      { _name: "Реквизит1", _id: "5", Title: "Реквизит1" },
    ])
  })

  it("does not restore ERP AdditionalColumns for another path", () => {
    const column = { _name: "Реквизит1", _id: "" }

    expect(
      restoreKnownDuplicateErpAdditionalColumns({
        currentXMLPath: "Catalogs/Другой/Forms/ФормаСписка/Ext/Form.xml",
        table: "Список.Способы",
        columnName: "Реквизит1",
        column,
      })
    ).toBeUndefined()
  })

  it("restores duplicate CommandBarButton ids only for the known master form sequence", () => {
    const items = [
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _name: "ЕстьКЭПРасширеннаяПодсказка", _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _name: "НетКЭПРасширеннаяПодсказка", _id: "" } } },
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _name: "ЕстьКЭПРасширеннаяПодсказка", _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _name: "НетКЭПРасширеннаяПодсказка", _id: "" } } },
    ]

    expect(
      restoreKnownDuplicateCommandBarButtonIds({
        currentXMLPath: MASTER_SIMPLIFIED_CONNECTION_FORM,
        items,
      })
    ).toEqual([
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "1823", ExtendedTooltip: { _name: "ЕстьКЭПРасширеннаяПодсказка", _id: "1825" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "1824", ExtendedTooltip: { _name: "НетКЭПРасширеннаяПодсказка", _id: "1826" } } },
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "1314", ExtendedTooltip: { _name: "ЕстьКЭПРасширеннаяПодсказка", _id: "1315" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "1316", ExtendedTooltip: { _name: "НетКЭПРасширеннаяПодсказка", _id: "1317" } } },
    ])
  })

  it("does not restore duplicate CommandBarButton ids for another path", () => {
    const items = [
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
    ]

    expect(
      restoreKnownDuplicateCommandBarButtonIds({
        currentXMLPath: "DataProcessors/Другой/Forms/Форма/Ext/Form.xml",
        items,
      })
    ).toEqual(items)
  })
})
