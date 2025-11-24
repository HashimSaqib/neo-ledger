# Internationalization

The application uses PO files for managing translations. This is a standard format supported by most translation tools.

## Workflow

After adding new translatable strings, run:

```bash
npm run i18n:sync
```

This extracts strings from source files, updates PO files, and compiles them to JSON.

To translate strings, edit the PO files in `src/i18n/locales/{locale}/messages.po`:

```po
msgid "Welcome"
msgstr "Willkomme"
```

## Development

Can Run watch in a separate terminal during development to automatiocally compile PO files to JSON when they're modified

```bash
npm run i18n:watch
```

## Commands

| Command                | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run i18n:sync`    | Extract, update, and compile all translations |
| `npm run i18n:watch`   | Auto-compile PO files on save                 |
| `npm run i18n:compile` | Compile PO files to JSON only                 |

## File Structure

```
src/i18n/
├── locales/
│   ├── en/
│   │   ├── messages.po
│   │   └── messages.json  (generated)
│   └── de-CH/
│       ├── messages.po
│       └── messages.json  (generated)
└── messages.pot           (generated)
```

Edit only the `.po` files. JSON files are generated automatically and should not be edited manually.

## Language Switching

Use the `setLanguage` function:

```javascript
import { setLanguage } from "src/boot/i18n";
import { useQuasar } from "quasar";

const $q = useQuasar();

await setLanguage("de-CH", $q);
```

## String Interpolation

```vue
<template>
  <p>{{ t("Hello {name}", { name: userName }) }}</p>
</template>
```

In the PO file:

```po
msgid "Hello {name}"
msgstr "Hallo {name}"
```

## Adding a Language

Create the locale directory:

```bash
mkdir -p src/i18n/locales/fr
```

Run sync to generate the PO file:

```bash
npm run i18n:sync
```

Import the locale in `src/boot/i18n.js`:

```javascript
import frMessages from "../i18n/locales/fr/messages.json";

const i18n = createI18n({
  messages: {
    en: enMessages,
    "de-CH": deChMessages,
    fr: frMessages,
  },
});
```

## PO File Format

PO files use a simple key-value format:

```po
msgid "Login"
msgstr "Aamälde"
```

Comments can be added for context:

```po
# Displayed on the main login button
msgid "Login"
msgstr "Aamälde"
```

## Notes

- JSON files are ignored by git
- PO files should be committed to version control
- The POT file is regenerated on each sync
- Untranslated strings fall back to the source text
