import { TTable } from "./types"

const ROW_SEPARATOR: string = t.VBar.LABEL as string

  export const formatTable = (element: TTable): string[] => {
    let result: string[] = []

    const propertiesFormatter = FormFormatterFactory.getPropertiesFormatter()
    const properties = propertiesFormatter.formatSingleLine(element)
    if (properties.length > 0) {
      result.push(properties.join(""))
    }

    const columns: TableHeaderRow = element.columns.map(
      (column: TableHeaderElement) => this.getFormatterColumn(column)
    )

    const header = this.getHeaderTable(columns)
    const compactHeader = this.getHeaderTable(columns, this.compactHeaderFilter)

    const table: ITableFormatterCell[][] = []

    this.addHeaderRows(table, header)
    this.addSeparatorRow(table, compactHeader)
    this.addBodyRows(table, compactHeader, element.rows, 0)

    this.calculateLength(header)

    result.push(...this.renderTable(table))

    return result
  }

  const compactHeaderFilter = (item: ConvertableTreeNode): boolean => {
    return !(item as TableFormatterColumn).isColumnGroup()
  }

  const getFormatterColumn = (column: TableHeaderElement): TableFormatterColumn => {
    const result = new TableFormatterColumn(column)
    column.items.forEach((child: TableHeaderElement) => {
      result.add(this.getFormatterColumn(child))
    })
    return result
  }

  const getHeaderTable = (
    columns: TableHeaderRow,
    filter?: ((item: ConvertableTreeNode) => boolean) | undefined
  ): TableHeaderRow[] {
    const converter = new TreeToTableConverter(filter)

    columns.forEach((child: TableFormatterColumn) => {
      converter.add(child)
    })

    return converter.table as TableHeaderRow[]
  }

  const addHeaderRows = (
    table: ITableFormatterCell[][],
    headers: TableHeaderRow[]
  ): void {
    headers.forEach((headerRow) => {
      table.push([...headerRow])
    })
  }

  const addSeparatorRow = (
    table: ITableFormatterCell[][],
    compactHeader: TableHeaderRow[]
  ) {
    if (compactHeader.length === 0) {
      return
    }

    const separatorRow: ITableFormatterCell[] = []
    for (const column of compactHeader[compactHeader.length - 1]) {
      separatorRow.push(new TableFormatterSeparator(column))
    }
    table.push(separatorRow)
  }

  const addBodyRows = (
    result: ITableFormatterCell[][],
    compactHeader: TableFormatterColumn[][],
    rows: TableRowElement[],
    level: number = 0
  ) {
    for (const row of rows) {
      this.addBodyRow(result, compactHeader, row, level)
    }
  }

  const addBodyRow = (
    result: ITableFormatterCell[][],
    compactHeader: TableFormatterColumn[][],
    row: TableRowElement,
    level: number
  ) {
    const cellsCache: Map<TableColumnElement, TableFormatterRowCell> = new Map()
    for (const headerRow of compactHeader) {
      const currentRow: ITableFormatterCell[] = []

      let isFirst = true
      for (const column of headerRow) {
        const columnElement = column.getElement() as TableColumnElement
        let cell = cellsCache.get(columnElement)

        if (!cell) {
          let cellElement =
            row.getByColumn(columnElement) ?? new TableCellElement()
          cell = new TableFormatterRowCell(cellElement, column, isFirst, level)
          cellsCache.set(columnElement, cell)
        }

        currentRow.push(cell)

        isFirst = false
      }
      result.push(currentRow)
    }

    this.addBodyRows(result, compactHeader, row.rows, level + 1)
  }

  const renderTable = (rows: ITableFormatterCell[][]): string[] => {
    const result: string[] = []
    const used: ITableFormatterCell[] = []
    for (const row of rows) {
      const usedInRow: ITableFormatterCell[] = []
      const currentRow: string[] = []
      for (const cell of row) {
        currentRow.push(this.getCellValue(cell, used, usedInRow))
        usedInRow.push(cell)
      }
      result.push(
        this.rowSeparator +
          currentRow.join(this.rowSeparator) +
          this.rowSeparator
      )
      used.push(...usedInRow)
    }

    return result
  }

  const getCellValue = (
    cell: ITableFormatterCell,
    used: ITableFormatterCell[],
    usedInRow: ITableFormatterCell[]
  ): string {
    if (usedInRow.includes(cell)) {
      return ""
    }

    if (used.includes(cell)) {
      return cell.getEmptyValue()
    }

    return cell.getValue()
  }

  const calculateLength = (header: TableFormatterColumn[][]) => {
    const firstRow = header[0]
    for (const cell of firstRow) {
      cell.calculateMaxLength()
      cell.calculateLength()
    }
  }
}
