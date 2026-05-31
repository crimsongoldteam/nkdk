# Дизайн: восстановить фикстуры форм для тестов core

## Контекст

После исправления `packages/graph` оставшиеся падения `packages/core` относятся к формам:

- тесты элементов формы ищут XML для `HTMLDocumentField` и `PDFDocumentField` в папках `hTMLDocumentField` и `pDFDocumentField`;
- реальные проектные фикстуры уже лежат в `htmlDocumentField/__fixtures__` и `pdfDocumentField/__fixtures__`;
- тест `registers commonObjects before reading form title from XML` в `clientApplicationForm/convertFromXML.test.ts` читает форму по абсолютному пути `/Users/nikita/git/round-trip-source/...`, которого нет в текущей среде;
- исходная форма найдена в `/home/nikita/git/round-trip/acc/Catalogs/КонтактныеЛица/Forms/ФормаВыбораЛидов.xml` и `.../ФормаВыбораЛидов/Ext/Form.xml`.

## Цель

Сделать тесты `packages/core` независимыми от внешних абсолютных путей и восстановить доступ к уже перенесённым XML-фикстурам HTML/PDF элементов.

## Выбранный подход

1. Для `HTMLDocumentField` и `PDFDocumentField` явно указать `xmlFolder` в списке элементных фикстур:
   - `HTMLDocumentField` -> `htmlDocumentField`;
   - `PDFDocumentField` -> `pdfDocumentField`.
2. Добавить в обычную проектную папку фикстур `clientApplicationForm/__fixtures__` форму `ФормаВыбора`, основанную на `ФормаВыбораЛидов`.
3. Урезать новую фикстуру до данных, нужных тесту:
   - metadata XML с именем `ФормаВыбора`;
   - `Ext/Form.xml` с минимальным деревом `ChildItems`, содержащим `ButtonGroup name="ГруппаСтандартныеКоманды"` и `Title` со значением `Стандартные команды`.
4. Перевести тест `registers commonObjects before reading form title from XML` на проектную фикстуру `ФормаВыбора`.

## Почему так

Фикстуры остаются в проекте и становятся воспроизводимыми на любой машине.
Мы не меняем существующие XML-фикстуры и не добавляем лишние данные из большого `Ext/Form.xml`, потому что тест проверяет только регистрацию commonObjects и чтение `Title` у вложенного `ButtonGroup`.

## Изменения

- `packages/core/metadata/forms/elements/__tests__/fixtures.ts`:
  - добавить `xmlFolder` для двух групп HTML/PDF.
- `packages/core/metadata/forms/clientApplicationForm/__fixtures__/ФормаВыбора.xml`:
  - новая минимальная metadata-фикстура формы.
- `packages/core/metadata/forms/clientApplicationForm/__fixtures__/ФормаВыбора/Ext/Form.xml`:
  - новая минимальная внешняя XML-фикстура формы.
- `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`:
  - заменить абсолютный путь на путь к проектным фикстурам;
  - заменить `formName` с `ФормаВыбораЛидов` на `ФормаВыбора`.

## Проверка

После реализации выполнить:

```sh
pnpm --filter @nakidka/core test -- metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/clientApplicationForm/convertFromXML.test.ts
pnpm --filter @nakidka/core test
pnpm test
```

Ожидаемый результат: ранее падавшие тесты `packages/core` проходят без зависимости от `/Users/...`.
