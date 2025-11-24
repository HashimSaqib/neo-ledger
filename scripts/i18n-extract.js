import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Regex patterns to find translatable strings
const patterns = [
  // $t('key') or $t("key")
  /\$t\(['"]([^'"]+)['"]\)/g,
  // t('key') or t("key") - composition API
  /\bt\(['"]([^'"]+)['"]\)/g,
  // v-t directive
  /v-t="['"]([^'"]+)["']"/g,
  // i18n-t component
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

function generatePOT() {
  const now = new Date();
  const timestamp =
    now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0];

  let pot = `# Neo Ledger Translation Template
#
msgid ""
msgstr ""
"Project-Id-Version: Neo Ledger 0.0.1\\n"
"Report-Msgid-Bugs-To: \\n"
"POT-Creation-Date: ${timestamp}+0000\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"Language: \\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"

`;

  // Sort keys alphabetically for better diffs
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

function escapeString(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

// Main execution
console.log("Scanning Vue files for translatable strings...");
scanDirectory(path.join(rootDir, "src"));

console.log(`Found ${translations.size} unique translatable strings`);

const potPath = path.join(rootDir, "src/i18n/messages.pot");
const potContent = generatePOT();
fs.writeFileSync(potPath, potContent, "utf8");

console.log(`Generated POT file: ${potPath}`);
console.log("\nNext steps:");
console.log("   1. Update PO files: npm run i18n:update");
console.log("   2. Translate strings in src/i18n/locales/*/messages.po");
console.log("   3. Compile translations: npm run i18n:compile");
