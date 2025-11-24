import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import gettextParser from "gettext-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const localesDir = path.join(rootDir, "src/i18n/locales");

// Get all locales
const locales = fs
  .readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

console.log("Compiling PO files to JSON...");

let totalCompiled = 0;

for (const locale of locales) {
  const poPath = path.join(localesDir, locale, "messages.po");
  const jsonPath = path.join(localesDir, locale, "messages.json");

  if (!fs.existsSync(poPath)) {
    console.warn(`${locale}: messages.po not found, skipping...`);
    continue;
  }

  console.log(`\nCompiling ${locale}...`);

  const poContent = fs.readFileSync(poPath, "utf8");
  const parsed = gettextParser.po.parse(poContent);

  const messages = {};
  const translations = parsed.translations[""];
  let translatedCount = 0;
  let totalCount = 0;

  for (const [msgid, entry] of Object.entries(translations)) {
    if (msgid === "") continue;

    totalCount++;
    const msgstr = entry.msgstr[0];

    if (msgstr && msgstr !== "") {
      messages[msgid] = msgstr;
      translatedCount++;
    } else {
      messages[msgid] = msgid;
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(messages, null, 2), "utf8");

  const percentage =
    totalCount > 0 ? Math.round((translatedCount / totalCount) * 100) : 0;
  console.log(
    `   ${translatedCount}/${totalCount} strings translated (${percentage}%)`
  );
  console.log(`   Generated: ${jsonPath}`);

  totalCompiled++;
}

console.log(`\nCompiled ${totalCompiled} locale(s) successfully!`);
console.log("\nYou can now use the translations in your app.");
