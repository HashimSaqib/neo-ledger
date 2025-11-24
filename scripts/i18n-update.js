import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import gettextParser from "gettext-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const potPath = path.join(rootDir, "src/i18n/messages.pot");
const localesDir = path.join(rootDir, "src/i18n/locales");

if (!fs.existsSync(potPath)) {
  console.error("POT file not found. Run npm run i18n:extract first.");
  process.exit(1);
}

console.log("Reading POT template...");
const potContent = fs.readFileSync(potPath, "utf8");
const potData = gettextParser.po.parse(potContent);

const locales = fs
  .readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

console.log(`Found locales: ${locales.join(", ")}`);

for (const locale of locales) {
  const poPath = path.join(localesDir, locale, "messages.po");

  console.log(`\nUpdating ${locale}...`);

  let existingData;
  if (fs.existsSync(poPath)) {
    const existingContent = fs.readFileSync(poPath, "utf8");
    existingData = gettextParser.po.parse(existingContent);
  } else {
    existingData = JSON.parse(JSON.stringify(potData));
  }

  existingData.headers = {
    ...potData.headers,
    Language: locale,
    "Language-Team": getLanguageTeamName(locale),
    "PO-Revision-Date": new Date().toISOString().split("T")[0] + " 00:00+0000",
  };

  const newTranslations = potData.translations[""];
  const existingTranslations = existingData.translations[""] || {};
  const mergedTranslations = {};

  mergedTranslations[""] = existingTranslations[""] || newTranslations[""];

  let addedCount = 0;
  let updatedCount = 0;

  for (const [msgid, entry] of Object.entries(newTranslations)) {
    if (msgid === "") continue;

    if (existingTranslations[msgid]) {
      mergedTranslations[msgid] = {
        ...entry,
        msgstr: existingTranslations[msgid].msgstr,
      };
      updatedCount++;
    } else {
      mergedTranslations[msgid] = entry;
      addedCount++;
    }
  }

  existingData.translations[""] = mergedTranslations;

  const output = gettextParser.po.compile(existingData);
  fs.writeFileSync(poPath, output);

  console.log(
    `   ${addedCount} new strings added, ${updatedCount} existing strings preserved`
  );
}

console.log("\nAll PO files updated");
console.log("\nNext steps:");
console.log("   1. Translate new strings in src/i18n/locales/*/messages.po");
console.log("   2. Compile translations: npm run i18n:compile");

function getLanguageTeamName(locale) {
  const names = {
    en: "English",
    "de-CH": "Swiss German",
    de: "German",
    fr: "French",
    it: "Italian",
  };
  return names[locale] || locale;
}
