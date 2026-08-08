# Round-trip мобильных разрешений конфигурации

## Цель

Устранить потерю `app:permissionMessage` при полном XML → YAML → XML round-trip конфигурации и одновременно смоделировать соседнее свойство `RequiredMobileApplicationPermissions`, которое сейчас отключено от YAML и ошибочно представлено строкой.

Изменение YAML-контракта `ИспользуемаяФункциональностьМобильногоПриложения` намеренно несовместимо. Поддержка прежнего массива не требуется.

## Источники истины

- `mngapp.xsdmngcore_root.res`: `UsedFunctionality` содержит последовательности `functionality*`, затем `permissionMessage*`; `RequiredPermissionMessage` содержит обязательные `permission` и `description`; `RequiredPermission` содержит обязательные `permission`, `use` и `description`.
- `model.xdtobackend_root.res`: свойства конфигурации имеют типы `RequiredPermissions` и `UsedFunctionality`.
- Синтакс-помощник из `/Users/nikita/git/1c_res/hlp`: официальные русские имена свойства `ИспользуемаяФункциональностьМобильногоПриложения`, свойства `ТребуемыеРазрешенияМобильногоПриложения` и значений `MobileApplicationFunctionalities`.
- Исходный `Configuration.xml` из round-trip `/Users/nikita/git/sed_xml/cf`: семь реальных `app:permissionMessage`, включая `PostNotifications` и локализованные описания.

Схемы фиксируют структуру и внутренние XML-значения, но их список `MobileApplicationFunctionalities` отстаёт от Синтакс-помощника: в XSD отсутствуют `SpeechToText` и `TextToSpeech`. Поэтому существующий актуальный список функциональностей сохраняется.

## YAML-контракт

```yaml
ТребуемыеРазрешенияМобильногоПриложения:
  - Разрешение: Камера
    Использовать: Истина
    Описание:
      ru: Доступ к камере

ИспользуемаяФункциональностьМобильногоПриложения:
  Функциональности:
    - Функциональность: Камера
      Использовать: Истина
  СообщенияРазрешений:
    - Разрешение: Камера
      Описание:
        ru: Это позволит производить съемку фото или видео.
    - Разрешение: PostNotifications
      Описание:
        ru: Это позволит отображать уведомления.
```

`Функциональности` хранит только отклонения от clean-набора, как прежний массив. Обе коллекции разрешений хранят все заданные элементы без устранения повторов и с сохранением порядка.

`Описание` использует существующий YAML-контракт `I8nText`: строка означает текст на основном языке конфигурации, объект задаёт тексты по языкам. Пустая строка и пустой объект допустимы, но само поле `Описание` обязательно.

## Системные перечисления

Добавляются отдельные типы `RequiredMobileApplicationPermissionMessages` и `RequiredMobileApplicationPermissions`. Нельзя использовать вместо них `MobileApplicationFunctionalities`: наборы и некоторые XML-имена различаются.

### Сообщения разрешений

| XML | YAML |
| --- | --- |
| `Biometrics` | `Биометрия` |
| `Location` | `Геопозиционирование` |
| `BackgroundLocation` | `ГеопозиционированиеВФоновомРежиме` |
| `BluetoothPrinters` | `BluetoothПринтеры` |
| `Contacts` | `Контакты` |
| `Calendars` | `Календари` |
| `NumberDialing` | `НаборНомера` |
| `CallProcessing` | `ОбработкаЗвонков` |
| `CallLog` | `ЖурналЗвонков` |
| `AutoSendSMS` | `АвтоматическаяОтправкаSMSСообщений` |
| `ReceiveSMS` | `ПолучениеSMS` |
| `SMSLog` | `ЖурналSMS` |
| `Camera` | `Камера` |
| `Microphone` | `Микрофон` |
| `MusicLibrary` | `БиблиотекаМузыки` |
| `PictureAndVideoLibraries` | `БиблиотекиКартинокИВидео` |
| `AudioPlaybackAndVibration` | `ВоспроизведениеАудиоИВибрация` |
| `PermissionGroupPhone` | `PermissionGroupPhone` |
| `PermissionGroupCallLog` | `PermissionGroupCallLog` |
| `PermissionGroupSMS` | `PermissionGroupSMS` |
| `PostNotifications` | `PostNotifications` |

### Требуемые разрешения

| XML | YAML |
| --- | --- |
| `Multimedia` | `Мультимедиа` |
| `Location` | `Геопозиционирование` |
| `Contacts` | `Контакты` |
| `Calendars` | `Календари` |
| `Telephony` | `Телефония` |
| `PushNotification` | `PushУведомления` |
| `LocalNotification` | `ЛокальныеУведомления` |
| `Print` | `Печать` |
| `InAppPurchases` | `ВстроенныеПокупки` |
| `Ads` | `Реклама` |
| `BackgroundLocation` | `ГеопозиционированиеВФоновомРежиме` |
| `BackgroundAudioPlayback` | `ВоспроизведениеАудиоИВибрацияВФоновомРежиме` |
| `FileExchangeWithPersonalComputer` | `ОбменФайламиСПерсональнымКомпьютером` |
| `CallPhone` | `НаборНомера` |
| `HandlePhoneCalls` | `ОбработкаЗвонков` |
| `CallLog` | `ЖурналЗвонков` |
| `SendSMS` | `АвтоматическаяОтправкаSMSСообщений` |
| `ReceiveSMS` | `ПолучениеSMS` |
| `SMSLog` | `ЖурналSMS` |
| `Camera` | `Камера` |
| `Microphone` | `Микрофон` |
| `MusicLibrary` | `БиблиотекаМузыки` |
| `PicturesAndVideoLibraries` | `БиблиотекиКартинокИВидео` |
| `AudioAndVibrationPlayback` | `ВоспроизведениеАудиоИВибрация` |
| `PermissionGroupPhone` | `PermissionGroupPhone` |
| `PermissionGroupCallLog` | `PermissionGroupCallLog` |
| `PermissionGroupSMS` | `PermissionGroupSMS` |
| `InstallPackages` | `УстановкаПриложений` |
| `AllowOSBackup` | `РезервноеКопированиеСредствамиОС` |
| `Biometrics` | `Биометрия` |
| `BluetoothPrinters` | `BluetoothПринтеры` |
| `WiFiPrinters` | `WiFiПринтеры` |
| `AllFilesAccess` | `ДоступКоВсемФайлам` |
| `Videoconferences` | `Видеоконференции` |
| `NFC` | `NFC` |
| `PostNotifications` | `PostNotifications` |
| `Geofences` | `Геозоны` |
| `IncomingShareRequests` | `ВходящиеЗапросыПоделиться` |
| `AllIncomingShareRequestsTypesProcessing` | `ОбработкаВсехТиповВходящихЗапросовПоделиться` |

Для `PermissionGroupPhone`, `PermissionGroupCallLog`, `PermissionGroupSMS` и `PostNotifications` официальные русские имена не найдены ни в Синтакс-помощнике, ни в приложенном методическом тексте. Они намеренно остаются без перевода. Это исключение добавляется в `.agents/restrictions.md`.

## Модель и компоненты

Выбран вариант с двумя специализированными типами без расширения общих типов и параметров правил.

`UsedMobileApplicationFunctionalities` меняется с массива на объект:

```ts
interface UsedMobileApplicationFunctionalities {
  functionalities: UsedMobileApplicationFunctionality[]
  permissionMessages: RequiredMobileApplicationPermissionMessage[]
}
```

`RequiredMobileApplicationPermissions` моделируется отдельно как массив элементов `{ permission, use, description }`.

- существующий `usedMobileApplicationFunctionalities.ts` отвечает за обе части XML-контейнера `UsedMobileApplicationFunctionalities`;
- новый специализированный тип отвечает за XML-контейнер `RequiredMobileApplicationPermissions`;
- `rules.ts` заменяет отключённый `stringRule` требуемых разрешений на новый тип;
- преобразования описаний переиспользуют существующие функции `I8nText`;
- общие `BasePropertyRule`, `PropertyRule` и параметры построителей не меняются;
- общий преобразователь коллекций не добавляется: различия двух XML-контейнеров важнее небольшого возможного повторения.

## Неявные значения и reference XML

Отсутствие YAML имеет явный смысл:

- `ТребуемыеРазрешенияМобильногоПриложения` подразумевает пустую коллекцию;
- `ИспользуемаяФункциональностьМобильногоПриложения` подразумевает clean-набор функциональностей и пустую коллекцию сообщений;
- отсутствие вложенного `Функциональности` подразумевает clean-набор;
- отсутствие вложенного `СообщенияРазрешений` подразумевает пустую коллекцию.

Корневые правила декларируют соответствующие `implicitValueYAML`. Специализированные преобразователи нормализуют вложенные отсутствующие поля. `defaultValue` и XML-default остаются отдельным механизмом: они восстанавливают обязательную полную XML-форму, тогда как `implicitValueYAML` описывает значение отсутствующего YAML.

Специализированные типы используют канонические неявные значения и явно сравнивают их по содержимому. Корректность удаления данных не должна зависеть от равенства объектов или массивов по ссылке в общем слое.

Если YAML-ключ отсутствует, отличающееся значение из reference XML не сохраняется. Это позволяет удалить сообщения или требуемые разрешения удалением YAML-поля. Reference XML сохраняется только там, где его значение эквивалентно неявному.

## XML-контракт

Экспорт соблюдает порядок `xs:sequence`:

1. все `app:functionality`;
2. все `app:permissionMessage`.

Внутри элементов порядок также соответствует схеме:

- функциональность: `app:functionality`, `app:use`;
- сообщение: `app:permission`, `app:description`;
- требуемое разрешение: `app:permission`, `app:use`, `app:description`.

Пустые корневые коллекции восстанавливаются как пустые XML-теги. Повторяющиеся элементы и их исходный порядок сохраняются.

## Валидация и ошибки

- JSON Schema требует `Функциональность` и `Использовать` у элемента функциональности.
- JSON Schema требует `Разрешение` и `Описание` у сообщения.
- JSON Schema требует `Разрешение`, `Использовать` и `Описание` у требуемого разрешения.
- Значения разрешений ограничены соответствующим системным перечислением.
- Неизвестные значения отклоняются валидацией, а не молча пропускаются.
- Пустое значение `Описание` допустимо, поскольку `LocalStringType` может быть пустым; отсутствие обязательного XML-элемента или YAML-поля является ошибкой.

## Проверки

Существующие XML-фикстуры не изменяются. Новые договоры проверяются на наиболее узком стабильном уровне и одним интеграционным случаем конфигурации.

- семь реальных `permissionMessage` проходят XML → YAML → XML без потерь;
- многоязычное и пустое описание проходят обе стороны преобразования;
- четыре непереводимых значения принимаются и сохраняются без изменения;
- `RequiredMobileApplicationPermissions` проходит обе стороны преобразования;
- `Функциональности` остаются компактными отклонениями и восстанавливают 38 clean-значений;
- XML-порядок соответствует схеме;
- отсутствие YAML удаляет отличающиеся значения из reference XML;
- JSON Schema принимает корректный контракт и отклоняет отсутствующие поля и неизвестные перечисления;
- полный round-trip `/Users/nikita/git/sed_xml/cf` больше не удаляет семь `app:permissionMessage`.

Проверка реализации:

```sh
pnpm type-check
pnpm test
pnpm test:architecture
pnpm check:duplicates -- --base dac57a7da30e064a479d5842e9a6645d6a543b61
```

## Отклонённые варианты

- Поддержка прежнего массива YAML отклонена: согласован немедленный несовместимый переход на объект.
- Отдельное корневое YAML-поле для сообщений отклонено: оно искажало бы XML-модель `UsedFunctionality`.
- Общий преобразователь элементов разрешений отложен до появления третьего потребителя или содержательного повторения.
- Универсальный построитель вложенных коллекций в `rules.ts` отклонён как несоразмерное расширение общей архитектуры.
- `!xml` не используется: форма полностью восстанавливается из смысловых YAML-данных и схемы.
