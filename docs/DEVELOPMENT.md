# Разработка и тестове · Development and tests

[Български](../README.md) · [English](../README.en.md) · [Архитектура / Architecture](ARCHITECTURE.md)

## Български

Готовата игра е [GENESIS_Beyond_Matter.html](../GENESIS_Beyond_Matter.html). Изходният код е в `src/`. За промяна по играта редактирай модула и генерирай HTML файла отново, за да влезе промяната и в разпространяваното копие. Промени само по Markdown документацията не изискват сглобяване.

| Задача | Откъде да започнеш |
| --- | --- |
| Промяна в правило, рецепта или сграда | [catalog.js](../src/catalog.js) и [actions.js](../src/actions.js) |
| Поведение на популации или планетарно състояние | [ecology.js](../src/ecology.js) и [world.js](../src/world.js) |
| Промяна на панел или неговите надписи | [panels.js](../src/panels.js), [words.js](../src/words.js) и [client.js](../src/client.js). Провери съответните стъпки и в двата урока. |
| Съвместимост на записите | [persistence.js](../src/persistence.js) и [тестовете на правилата](../tests/rules.test.cjs) |
| Заснемане на играта | [Кадри, координати и двуезични надписи](gallery/README.md) |

Отвори **CMD в разархивираната коренова папка**, където е `START_GAME.bat`. За сглобяване ти трябва Python 3, а за посочените тестове — Node.js 20 или по-нов. Командите се изпълняват поотделно.

```bat
py tools\build.py
node --test tests\rules.test.cjs
node tests\journey.cjs PELAGOS
```

Първата команда създава доставяния HTML от модулите. Втората изпълнява тестовете на правилата. Третата проследява игрова кампания с фиксиран seed. За ръчна проверка отвори сглобения HTML, направи запис през **Записи → Експортирай**, импортирай го през същото меню и сравни планетата, епохата и генетичната линия. Подробностите за тестовата среда и границите на измерванията са в [отчета за производителността](../reports/PERFORMANCE.md).

## English

The [standalone HTML](../GENESIS_Beyond_Matter.html) is the playable distribution. Edit the relevant module under `src/`, then rebuild the HTML to ship a gameplay change. Markdown-only changes can be read immediately.

| Working on | Start here |
| --- | --- |
| A rule, recipe or building | [catalog.js](../src/catalog.js) and [actions.js](../src/actions.js) |
| Population behaviour or persistent planetary state | [ecology.js](../src/ecology.js) and [world.js](../src/world.js) |
| A panel or its labels | [panels.js](../src/panels.js), [words.js](../src/words.js) and [client.js](../src/client.js). Check the matching steps in both walkthroughs. |
| Save compatibility | [persistence.js](../src/persistence.js) and the [rules tests](../tests/rules.test.cjs) |
| Screenshots for the repository | [Shot list, coordinates and bilingual captions](gallery/README.md) |

Run the three commands above in **Windows Command Prompt** from the extracted root folder containing `START_GAME.bat`. Python 3 builds the distribution. Node.js 20 or later runs the listed tests. They cover the rules and a seeded campaign. To check save portability yourself, open the rebuilt HTML, use **Saves → Export file**, import it through **Saves → Import file**, then compare the planet, epoch and genetic lineage. The [performance report (BG)](../reports/PERFORMANCE.md) describes the test environment and measurement limits.
