# Round-trip WebService XDTO Type Namespace

## Контекст

В XML WebService XDTO-типы могут быть записаны как текст с локальным namespace:

```xml
<XDTOReturningValueType xmlns:d6p1="http://www.1c.ru/dm">d6p1:DMResponse</XDTOReturningValueType>
```

и для параметров:

```xml
<XDTOValueType xmlns:d8p1="http://www.1c.ru/dm">d8p1:DMRequest</XDTOValueType>
```

Сейчас `XDTOReturningValueType` и `XDTOValueType` описаны как обычные строки.
Импорт сохраняет текст `d6p1:DMResponse`, но теряет атрибут
`xmlns:d6p1="..."`. После round-trip XML содержит префикс без локального
объявления namespace.

Встроенные типы вроде `xs:string`, `xs:boolean`, `xs:int`, `v8:ValueStorage`
локального namespace в этих узлах обычно не требуют. Проблема относится к
пользовательским XDTO-типам с локальным префиксом.

## Решение

Ввести отдельный тип свойства для XDTO type name, например `XDTOTypeName`, и
использовать его в:

- `MetadataWebServiceOperationRules.xdtoReturningValueType`;
- `MetadataWebServiceParameterRules.xdtoValueType`.

Модель и YAML остаются строковыми:

```yaml
ТипВозвращаемогоЗначенияXDTO: d6p1:DMResponse
Параметры:
  request:
    ТипЗначенияXDTO: d8p1:DMRequest
```

При импорте reference XML новый тип должен сохранить служебную информацию о
namespace-атрибутах узла. При экспорте с `referenceMetadata`, если текст типа
точно совпадает с reference, нужно вернуть исходные `xmlns:*` атрибуты.

Если reference нет, экспорт пишет обычную строку без локальных namespace, как
сейчас.

## Сопоставление

Совпадение с reference нужно проверять по тексту типа:

- `d6p1:DMResponse` совпадает только с `d6p1:DMResponse`;
- `xs:string` не требует локального namespace;
- если пользователь поменял тип в YAML, старый namespace из reference не
  переносится автоматически.

Это сохраняет точный XML round-trip и не выводит внутренние namespace-детали в
YAML.

## Границы

В рамках этой спеки:

- меняются только `XDTOReturningValueType` и `XDTOValueType` WebService;
- `XDTOPackages` не используются для вычисления namespace;
- YAML-формат остается строковым;
- XML-фикстуры из source-репозитория не изменяются;
- встроенные типы `xs:*` и `v8:*` продолжают экспортироваться как простая
  строка.

## Проверка

Для реализации нужны тесты:

- импорт reference `XDTOReturningValueType` с `xmlns:d6p1` сохраняет служебный
  namespace;
- export с тем же значением и reference возвращает `xmlns:d6p1`;
- import/export `XDTOValueType` с `xmlns:d8p1` делает то же для параметра;
- новая модель без reference экспортирует `d6p1:DMResponse` как строку без
  локального namespace;
- если значение в модели отличается от reference, namespace из reference не
  переносится.

После реализации нужно выборочно прогнать round-trip на файлах:

- `doc/WebServices/DMService.xml`;
- `small/WebServices/DMILService.xml`;
- `trade/WebServices/DMILService.xml`;
- `trade/WebServices/EnterpriseDataExchange_1_0_1_1.xml`.
