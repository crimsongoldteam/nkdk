# CommandInterface: reproducer для лишнего Index

## Контекст

Short round-trip нашёл первый diff в `Catalogs/БанковскиеСчетаКонтрагентов/Forms/ФормаСписка/Ext/Form.xml`: при экспорте в `CommandInterface.CommandBar.Item` добавляются теги `<Index>0</Index>`, `<Index>1</Index>`, `<Index>2</Index>`, которых не было в исходном XML.

Модель `CommandInterfaceItem` не хранит поле `index`; текущий `toXML` вычисляет индекс из позиции элемента в массиве. Reproducer должен зафиксировать, что отсутствие `Index` в исходном XML не должно превращаться в явные индексы при обратном экспорте.

## Решение

Используем подход (А): сначала локализуем все фикстуры `commandInterface`, затем добавляем reproducer в том же модуле.

Новый каталог:

```text
packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/
```

В него переносятся существующие общие фикстуры:

- `full.xml`
- `full.ts` с `fullCommandInterface` и `fullCommandInterfaceYAML`

После переноса тесты `fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`, `toYAML.test.ts` используют локальные фикстуры. Старые файлы `packages/core/tests/fixtures/commandInterface/full.xml` и `packages/core/tests/fixtures/commandInterface/data.ts` удаляются, если ссылок на них больше нет.

## Reproducer

Добавляются:

- `__fixtures__/commandBarIndexInsertion.xml`
- `__fixtures__/commandBarIndexInsertion.ts`

XML-фикстура содержит `CommandInterface` с `CommandBar` и тремя `Item` без `<Index>`, как в исходном XML из round-trip diff. TS-фикстура содержит ожидаемый `CommandInterface`: тот же порядок команд в массиве `CommandBar`, без индекса в элементах модели.

Тесты:

- `fromXML.test.ts` добавляет `it("import commandBarIndexInsertion")`
- `toXML.test.ts` добавляет `it("export commandBarIndexInsertion")`

Ожидаемый результат после калибровки:

- старые тесты `commandInterface` остаются зелёными;
- `import commandBarIndexInsertion` зелёный;
- `export commandBarIndexInsertion` красный только на лишних `<Index>`.

## Границы

Этот шаг не исправляет `toXML` и не меняет правила экспорта. Он только создаёт локальные фикстуры и узкий reproducer для будущего исправления.

Полный `pnpm test` не запускается в рамках `round-trip-xml`; после готового reproducer пользователь запускает его сам.
