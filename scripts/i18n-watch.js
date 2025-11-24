import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import gettextParser from "gettext-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const localesDir = path.join(rootDir, "src/i18n/locales");

console.log("Watching PO files\n");

function compilePOFile(locale) {
  const poPath = path.join(localesDir, locale, "messages.po");
  const jsonPath = path.join(localesDir, locale, "messages.json");

  if (!fs.existsSync(poPath)) {
    return;
  }

  try {
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

    const timestamp = new Date().toLocaleTimeString();
    const percentage =
      totalCount > 0 ? Math.round((translatedCount / totalCount) * 100) : 0;

    console.log(
      `[${timestamp}] ${locale}: ${translatedCount}/${totalCount} (${percentage}%)`
    );
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[${timestamp}] ${locale}: ${error.message}`);
  }
}

const locales = fs
  .readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

console.log("Initial compilation\n");
for (const locale of locales) {
  compilePOFile(locale);
}

console.log("\nWatching for changes (Ctrl+C to stop)\n");

for (const locale of locales) {
  const localePath = path.join(localesDir, locale);
  const poPath = path.join(localePath, "messages.po");

  if (fs.existsSync(poPath)) {
    fs.watch(poPath, (eventType) => {
      if (eventType === "change") {
        setTimeout(() => {
          compilePOFile(locale);
        }, 100);
      }
    });
  }
}

process.stdin.resume();
