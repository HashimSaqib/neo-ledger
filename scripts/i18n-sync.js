import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import gettextParser from "gettext-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const potPath = path.join(rootDir, "src/i18n/messages.pot");
const localesDir = path.join(rootDir, "src/i18n/locales");

const patterns = [
  /\$t\(['"]([^'"]+)['"]\)/g,
  /\bt\(['"]([^'"]+)['"]\)/g,
  /v-t="['"]([^'"]+)["']"/g,
  /<i18n-t[^>]+keypath=["']([^"']+)["']/g,
  // title: "..." or title: '...' in JavaScript objects
  /title\s*:\s*['"]([^'"]+)['"]/g,
];

const translations = new Map();

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (
      entry.isDirectory() &&
      !entry.name.startsWith(".") &&
      entry.name !== "node_modules"
    ) {
      scanDirectory(fullPath);
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".vue") || entry.name.endsWith(".js"))
    ) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(rootDir, filePath);

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const key = match[1];
      if (!translations.has(key)) {
        translations.set(key, {
          msgid: key,
          references: [],
        });
      }
      translations.get(key).references.push(relativePath);
    }
  }
}

function escapeString(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function generatePOT() {
  const now = new Date();
  const timestamp =
    now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0];

  let pot = `# Neo Ledger Translation Template
#
msgid ""
msgstr ""
"Project-Id-Version: Neo Ledger 0.0.1\\n"
"POT-Creation-Date: ${timestamp}+0000\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

`;

  const sortedKeys = Array.from(translations.keys()).sort();

  for (const key of sortedKeys) {
    const entry = translations.get(key);

    for (const ref of entry.references) {
      pot += `#: ${ref}\n`;
    }

    pot += `msgid "${escapeString(key)}"\n`;
    pot += `msgstr ""\n\n`;
  }

  return pot;
}

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

// Extract
console.log("Step 1: Extracting strings\n");

scanDirectory(path.join(rootDir, "src"));

const extractedCount = translations.size;
console.log(`Found ${extractedCount} translatable strings\n`);

const potContent = generatePOT();
fs.writeFileSync(potPath, potContent, "utf8");

// Update PO files
console.log("Step 2: Updating PO files\n");

const potData = gettextParser.po.parse(potContent);

const locales = fs
  .readdirSync(localesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

let totalAdded = 0;

for (const locale of locales) {
  const poPath = path.join(localesDir, locale, "messages.po");

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

  console.log(`${locale}: ${addedCount} new, ${updatedCount} preserved`);

  totalAdded += addedCount;
}

console.log();

// Compile to JSON
console.log("Step 3: Compiling to JSON\n");

let totalCompiled = 0;
let totalTranslated = 0;
let totalStrings = 0;

for (const locale of locales) {
  const poPath = path.join(localesDir, locale, "messages.po");
  const jsonPath = path.join(localesDir, locale, "messages.json");

  if (!fs.existsSync(poPath)) {
    continue;
  }

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
    `${locale}: ${translatedCount}/${totalCount} translated (${percentage}%)`
  );

  totalCompiled++;
  totalTranslated += translatedCount;
  totalStrings += totalCount;
}

console.log("\n" + "=".repeat(60));
console.log("Complete");
console.log("=".repeat(60));
console.log(`Extracted: ${extractedCount} strings`);
console.log(`Updated: ${totalAdded} new strings`);
console.log(`Compiled: ${totalCompiled} locales`);

if (totalStrings > 0) {
  const overallPercentage = Math.round((totalTranslated / totalStrings) * 100);
  console.log(
    `Progress: ${totalTranslated}/${totalStrings} (${overallPercentage}%)`
  );
}

console.log("=".repeat(60));

if (totalAdded > 0) {
  console.log("\nEdit src/i18n/locales/de-CH/messages.po to add translations");
}
