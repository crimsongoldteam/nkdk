import { describe, expect, it } from "vitest"
import {
  ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM,
  MASTER_SIMPLIFIED_CONNECTION_FORM,
  findKnownDuplicateCommandBarButtonReference,
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
        columnsCount: 1,
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
        columnsCount: 1,
        column,
      })
    ).toBeUndefined()
  })

  it("restores ERP duplicate AdditionalColumns for a config-prefixed known path", () => {
    const column = { _name: "Реквизит1", _id: "" }

    expect(
      restoreKnownDuplicateErpAdditionalColumns({
        currentXMLPath: `erp/${ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM}`,
        table: "Список.Способы",
        columnName: "Реквизит1",
        columnsCount: 1,
        column,
      })?.map((restoredColumn) => restoredColumn._id)
    ).toEqual(["1", "2", "3", "4", "5"])
  })

  it("does not restore ERP AdditionalColumns when the known group has multiple columns", () => {
    const column = { _name: "Реквизит1", _id: "" }

    expect(
      restoreKnownDuplicateErpAdditionalColumns({
        currentXMLPath: ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM,
        table: "Список.Способы",
        columnName: "Реквизит1",
        columnsCount: 2,
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

  it("restores duplicate CommandBarButton ids for a config-prefixed known path", () => {
    const items = [
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
    ]

    expect(
      restoreKnownDuplicateCommandBarButtonIds({
        currentXMLPath: `small/${MASTER_SIMPLIFIED_CONNECTION_FORM}`,
        items,
      }).map((item) => item.CommandBarButton._id)
    ).toEqual(["1823", "1824", "1314", "1316"])
  })

  it("finds duplicate CommandBarButton reference by index for the known master form", () => {
    const items = [
      { itemType: "CommandBarButton", name: "ЕстьКЭП" },
      { itemType: "CommandBarButton", name: "НетКЭП" },
      { itemType: "CommandBarButton", name: "ЕстьКЭП" },
      { itemType: "CommandBarButton", name: "НетКЭП" },
    ]
    const referenceItems = [
      { itemType: "CommandBarButton", name: "ЕстьКЭП", id: "1823" },
      { itemType: "CommandBarButton", name: "НетКЭП", id: "1824" },
      { itemType: "CommandBarButton", name: "ЕстьКЭП", id: "1314" },
      { itemType: "CommandBarButton", name: "НетКЭП", id: "1316" },
    ]

    expect(
      findKnownDuplicateCommandBarButtonReference({
        currentXMLPath: `small/${MASTER_SIMPLIFIED_CONNECTION_FORM}`,
        items,
        referenceItems,
        index: 2,
      })
    ).toEqual({ itemType: "CommandBarButton", name: "ЕстьКЭП", id: "1314" })
  })
})
