<template>
  <div class="cmpt-import relative-position">
    <div class="row q-gutter-md q-mb-md">
      <q-file
        v-model="selectedFile"
        :label="t('Select CMPT File')"
        outlined
        dense
        accept=".xml"
        @update:model-value="handleFileSelect"
        class="col-6"
        bg-color="input"
        label-color="secondary"
      >
        <template v-slot:prepend>
          <q-icon name="upload_file" />
        </template>
      </q-file>

      <q-btn
        color="primary"
        :label="t('Parse File')"
        @click="parseFile"
        :disable="!selectedFile"
        :loading="parsing"
        class="col-auto"
      />
    </div>

    <!-- Statement Header Information -->
    <div v-if="statementInfo" class="q-mb-md">
      <q-card class="q-pa-md">
        <div class="text-h6 q-mb-md">{{ t("Statement Information") }}</div>
        <div class="row q-gutter-md">
          <div class="col-md-6 col-12">
            <div class="text-subtitle2">{{ t("Account Details") }}</div>
            <div>
              <strong>{{ t("Account Holder") }}:</strong>
              {{ statementInfo.accountHolder }}
            </div>
            <div>
              <strong>{{ t("IBAN") }}:</strong> {{ statementInfo.iban }}
            </div>
            <div>
              <strong>{{ t("Currency") }}:</strong> {{ statementInfo.currency }}
            </div>
            <div>
              <strong>{{ t("Bank") }}:</strong> {{ statementInfo.bankName }}
            </div>
            <div>
              <strong>{{ t("BIC") }}:</strong> {{ statementInfo.bic }}
            </div>
          </div>
          <div class="col-md-6 col-12">
            <div class="text-subtitle2">{{ t("Statement Details") }}</div>
            <div>
              <strong>{{ t("Statement ID") }}:</strong>
              {{ statementInfo.statementId }}
            </div>
            <div>
              <strong>{{ t("Date Range") }}:</strong>
              {{ statementInfo.dateRange }}
            </div>
            <div>
              <strong>{{ t("Opening Balance") }}:</strong>
              {{ formatAmount(statementInfo.openingBalance) }}
              {{ statementInfo.currency }}
            </div>
            <div>
              <strong>{{ t("Closing Balance") }}:</strong>
              {{ formatAmount(statementInfo.closingBalance) }}
              {{ statementInfo.currency }}
            </div>
          </div>
        </div>
      </q-card>
    </div>

    <div class="q-mt-md">
      <div class="text-h6 q-mb-sm">
        {{ t("Parsed Transactions") }} ({{ parsedData.length }})
      </div>

      <div v-if="parsedData.length === 0" class="text-grey q-mb-md">
        No transactions found. Please select and parse a CMPT file.
      </div>

      <q-table
        v-if="parsedData.length > 0"
        :rows="parsedData"
        :columns="columns"
        row-key="id"
        dense
        :rows-per-page-options="[0]"
        hide-pagination
        class="mainbg"
      >
        <template v-slot:body-cell-amount="props">
          <q-td :props="props">
            <span
              :class="
                props.row.creditDebitInd === 'CRDT'
                  ? 'text-positive'
                  : 'text-negative'
              "
            >
              {{ formatAmount(props.row.amount) }}
            </span>
          </q-td>
        </template>

        <template v-slot:body-cell-date="props">
          <q-td :props="props">
            {{ formatDate(props.row.bookingDate) }}
          </q-td>
        </template>

        <template v-slot:body-cell-counterparty="props">
          <q-td :props="props">
            <div v-if="props.row.counterpartyName">
              <div class="text-weight-medium">
                {{ props.row.counterpartyName }}
              </div>
              <div
                v-if="props.row.counterpartyAddress"
                class="text-caption text-grey"
              >
                {{ props.row.counterpartyAddress }}
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-purpose="props">
          <q-td :props="props">
            <div v-if="props.row.remittanceInfo">
              <div class="text-weight-medium">
                {{ props.row.remittanceInfo }}
              </div>
              <div
                v-if="props.row.additionalInfo"
                class="text-caption text-grey"
              >
                {{ props.row.additionalInfo }}
              </div>
            </div>
          </q-td>
        </template>

        <template v-slot:body-cell-reference="props">
          <q-td :props="props">
            <div>
              <div v-if="props.row.endToEndId" class="text-caption">
                <strong>E2E:</strong> {{ props.row.endToEndId }}
              </div>
              <div v-if="props.row.instructionId" class="text-caption">
                <strong>Instr:</strong> {{ props.row.instructionId }}
              </div>
              <div v-if="props.row.paymentInfoId" class="text-caption">
                <strong>PmtInf:</strong> {{ props.row.paymentInfoId }}
              </div>
              <div v-if="props.row.creditorReference" class="text-caption">
                <strong>Ref:</strong> {{ props.row.creditorReference }}
              </div>
            </div>
          </q-td>
        </template>
      </q-table>
    </div>

    <div v-if="error" class="q-mt-md">
      <q-banner class="text-white bg-negative">
        {{ error }}
      </q-banner>
    </div>

    <q-inner-loading :showing="parsing">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { Notify } from "quasar";
import { formatAmount } from "src/helpers/utils";
const { t } = useI18n();
const emit = defineEmits(["close", "transactions-parsed"]);

const selectedFile = ref(null);
const parsedData = ref([]);
const statementInfo = ref(null);
const parsing = ref(false);
const error = ref("");

const columns = [
  {
    name: "date",
    label: t("Date"),
    field: "bookingDate",
    align: "left",
    sortable: true,
    style: "width: 100px",
  },
  {
    name: "amount",
    label: t("Amount"),
    field: "amount",
    align: "right",
    sortable: true,
    style: "width: 120px",
  },
  {
    name: "creditDebitInd",
    label: t("Type"),
    field: "creditDebitInd",
    align: "center",
    sortable: true,
    style: "width: 80px",
  },
  {
    name: "counterparty",
    label: t("Counterparty"),
    field: "counterpartyName",
    align: "left",
    sortable: true,
    style: "width: 200px",
  },
  {
    name: "iban",
    label: t("IBAN"),
    field: "counterpartyIban",
    align: "left",
    sortable: true,
    style: "width: 150px",
  },
  {
    name: "purpose",
    label: t("Purpose/Description"),
    field: "remittanceInfo",
    align: "left",
    sortable: true,
    style: "width: 250px",
  },
  {
    name: "reference",
    label: t("References"),
    field: "endToEndId",
    align: "left",
    sortable: true,
    style: "width: 200px",
  },
  {
    name: "bankTransactionCode",
    label: t("Bank Code"),
    field: "bankTransactionCode",
    align: "center",
    sortable: true,
    style: "width: 100px",
  },
];

const handleFileSelect = (file) => {
  if (file) {
    error.value = "";
    parsedData.value = [];
    statementInfo.value = null;
  }
};

const parseFile = async () => {
  if (!selectedFile.value) {
    Notify.create({
      message: t("Please select a file first"),
      type: "warning",
      position: "center",
    });
    return;
  }

  parsing.value = true;
  error.value = "";

  try {
    const text = await selectedFile.value.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // Check for parsing errors
    const parseError = xmlDoc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      throw new Error(t("Invalid XML file format"));
    }

    // Parse statement header information
    statementInfo.value = parseStatementHeader(xmlDoc);

    // Parse the CAMT.053 structure
    const entries = xmlDoc.getElementsByTagName("Ntry");
    console.log("Found entries:", entries.length);

    const transactions = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        const transaction = parseEntry(entry, i);
        console.log("Parsed transaction:", transaction);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (entryError) {
        console.warn("Error parsing entry:", entryError);
        // Continue with other entries
      }
    }

    console.log("Final transactions array:", transactions);
    parsedData.value = transactions;

    // Emit the parsed transactions to parent component
    emit("transactions-parsed", transactions);

    Notify.create({
      message: t("File parsed successfully. Found {count} transactions.", {
        count: transactions.length,
      }),
      type: "positive",
      position: "top-right",
    });
  } catch (err) {
    error.value = err.message || t("Error parsing file");
    Notify.create({
      message: error.value,
      type: "negative",
      position: "center",
    });
  } finally {
    parsing.value = false;
  }
};

const parseStatementHeader = (xmlDoc) => {
  const stmt = xmlDoc.getElementsByTagName("Stmt")[0];
  if (!stmt) return null;

  const account = stmt.getElementsByTagName("Acct")[0];
  const balances = stmt.getElementsByTagName("Bal");

  let openingBalance = 0;
  let closingBalance = 0;

  // Find opening and closing balances
  for (let i = 0; i < balances.length; i++) {
    const balance = balances[i];
    const balanceType = getNestedElementText(balance, "Tp", "CdOrPrtry", "Cd");
    const amount = parseFloat(getElementTextByTag(balance, "Amt")) || 0;

    if (balanceType === "OPBD") {
      openingBalance = amount;
    } else if (balanceType === "CLBD") {
      closingBalance = amount;
    }
  }

  return {
    statementId: getElementTextByTag(stmt, "Id"),
    accountHolder: getNestedElementText(account, "Ownr", "Nm"),
    iban: getNestedElementText(account, "Id", "IBAN"),
    currency: getElementTextByTag(account, "Ccy"),
    bankName: getNestedElementText(account, "Svcr", "FinInstnId", "Nm"),
    bic: getNestedElementText(account, "Svcr", "FinInstnId", "BICFI"),
    dateRange: getDateRange(stmt),
    openingBalance,
    closingBalance,
  };
};

const getDateRange = (stmt) => {
  const fromDate = getNestedElementText(stmt, "FrToDt", "FrDtTm");
  const toDate = getNestedElementText(stmt, "FrToDt", "ToDtTm");

  if (fromDate && toDate) {
    return `${formatDate(fromDate.split("T")[0])} - ${formatDate(
      toDate.split("T")[0]
    )}`;
  }
  return "";
};

const parseEntry = (entry, index) => {
  // Extract basic entry information
  const amtElement = entry.getElementsByTagName("Amt")[0];
  const amount = amtElement ? parseFloat(amtElement.textContent.trim()) : 0;
  const currency = amtElement ? amtElement.getAttribute("Ccy") || "" : "";

  const creditDebitInd = getElementTextByTag(entry, "CdtDbtInd");
  const status = getElementTextByTag(entry, "Sts");

  // Get dates
  const bookingDate =
    getElementTextByTag(entry, "BookgDt") ||
    getNestedElementText(entry, "BookgDt", "Dt");
  const valueDate =
    getElementTextByTag(entry, "ValDt") ||
    getNestedElementText(entry, "ValDt", "Dt");

  const accountServicerRef = getElementTextByTag(entry, "AcctSvcrRef");

  // Get bank transaction code
  const bankTransactionCode =
    getNestedElementText(entry, "BkTxCd", "Prtry", "Cd") ||
    getNestedElementText(entry, "BkTxCd", "Domn", "Cd");

  // Extract detailed information from NtryDtls
  const entryDetails = entry.getElementsByTagName("NtryDtls")[0];
  let remittanceInfo = "";
  let additionalInfo = "";
  let counterpartyName = "";
  let counterpartyAddress = "";
  let counterpartyIban = "";
  let endToEndId = "";
  let instructionId = "";
  let paymentInfoId = "";
  let creditorReference = "";

  if (entryDetails) {
    const txDetails = entryDetails.getElementsByTagName("TxDtls")[0];
    if (txDetails) {
      // Get additional transaction info
      additionalInfo = getElementTextByTag(txDetails, "AddtlTxInf") || "";

      // Get counterparty information from RltdPties
      const relatedParties = txDetails.getElementsByTagName("RltdPties")[0];
      if (relatedParties) {
        // Get creditor or debtor information
        const creditor = relatedParties.getElementsByTagName("Cdtr")[0];
        const debtor = relatedParties.getElementsByTagName("Dbtr")[0];
        const initiatingParty =
          relatedParties.getElementsByTagName("InitgPty")[0];

        // Determine counterparty based on transaction type
        let counterpartyElement = null;
        if (creditDebitInd === "CRDT" && debtor) {
          counterpartyElement = debtor;
        } else if (creditDebitInd === "DBIT" && creditor) {
          counterpartyElement = creditor;
        } else if (initiatingParty) {
          counterpartyElement = initiatingParty;
        }

        if (counterpartyElement) {
          counterpartyName = getElementTextByTag(counterpartyElement, "Nm");

          // Get address information
          const postalAddr =
            counterpartyElement.getElementsByTagName("PstlAdr")[0];
          if (postalAddr) {
            const addressParts = [];
            const streetName = getElementTextByTag(postalAddr, "StrtNm");
            const postCode = getElementTextByTag(postalAddr, "PstCd");
            const townName = getElementTextByTag(postalAddr, "TwnNm");
            const country = getElementTextByTag(postalAddr, "Ctry");
            const adrLine = getElementTextByTag(postalAddr, "AdrLine");

            if (adrLine) {
              addressParts.push(adrLine);
            } else {
              if (streetName) addressParts.push(streetName);
              if (postCode && townName)
                addressParts.push(`${postCode} ${townName}`);
              else if (postCode) addressParts.push(postCode);
              else if (townName) addressParts.push(townName);
            }
            if (country) addressParts.push(country);

            counterpartyAddress = addressParts.join(", ");
          }
        }

        // Get IBAN information
        const creditorAcct = relatedParties.getElementsByTagName("CdtrAcct")[0];
        const debtorAcct = relatedParties.getElementsByTagName("DbtrAcct")[0];

        if (creditDebitInd === "CRDT" && debtorAcct) {
          counterpartyIban = getNestedElementText(debtorAcct, "Id", "IBAN");
        } else if (creditDebitInd === "DBIT" && creditorAcct) {
          counterpartyIban = getNestedElementText(creditorAcct, "Id", "IBAN");
        }
      }

      // Get reference information
      const refs = txDetails.getElementsByTagName("Refs")[0];
      if (refs) {
        endToEndId = getElementTextByTag(refs, "EndToEndId");
        instructionId = getElementTextByTag(refs, "InstrId");
        paymentInfoId = getElementTextByTag(refs, "PmtInfId");
      }

      // Get remittance information
      const rmtInfo = txDetails.getElementsByTagName("RmtInf")[0];
      if (rmtInfo) {
        // Try unstructured first
        remittanceInfo = getElementTextByTag(rmtInfo, "Ustrd");

        // If no unstructured info, try structured
        if (!remittanceInfo) {
          const structured = rmtInfo.getElementsByTagName("Strd")[0];
          if (structured) {
            const additionalRmtInfo = getElementTextByTag(
              structured,
              "AddtlRmtInf"
            );
            if (additionalRmtInfo) {
              remittanceInfo = additionalRmtInfo;
            }

            // Get creditor reference
            const creditorRefInfo =
              structured.getElementsByTagName("CdtrRefInf")[0];
            if (creditorRefInfo) {
              creditorReference = getElementTextByTag(creditorRefInfo, "Ref");
            }
          }
        }
      }
    }
  }

  // Get additional entry info if no remittance info found
  if (!remittanceInfo) {
    const addtlNtryInf = getElementTextByTag(entry, "AddtlNtryInf");
    if (addtlNtryInf) {
      remittanceInfo = addtlNtryInf;
    }
  }

  return {
    id: `${accountServicerRef}-${index}`,
    bookingDate: bookingDate,
    valueDate: valueDate,
    amount: amount,
    currency: currency,
    creditDebitInd: creditDebitInd,
    status: status,
    accountServicerRef: accountServicerRef,
    bankTransactionCode: bankTransactionCode,
    counterpartyName: counterpartyName,
    counterpartyAddress: counterpartyAddress,
    counterpartyIban: counterpartyIban,
    remittanceInfo: remittanceInfo,
    additionalInfo: additionalInfo,
    endToEndId: endToEndId,
    instructionId: instructionId,
    paymentInfoId: paymentInfoId,
    creditorReference: creditorReference,
  };
};

const getElementTextByTag = (parent, tagName) => {
  const element = parent.getElementsByTagName(tagName)[0];
  return element ? element.textContent.trim() : "";
};

const getNestedElementText = (parent, ...tagNames) => {
  let current = parent;
  for (const tagName of tagNames) {
    const element = current.getElementsByTagName(tagName)[0];
    if (!element) return "";
    current = element;
  }
  return current.textContent.trim();
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch {
    return dateString;
  }
};

const closeDialog = () => {
  emit("close");
};
</script>

<style scoped>
.q-table {
  background-color: var(--q-primary);
}

.q-card {
  border: 1px solid #e0e0e0;
}

.text-caption {
  font-size: 0.75rem;
  line-height: 1.2;
}
</style>
