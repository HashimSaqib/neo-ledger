<template>
  <q-page class="lightbg q-pa-sm">
    <q-table
      :rows="employees"
      :columns="columns"
      row-key="id"
      flat
      bordered
      separator="horizontal"
      hide-bottom
    >
      <!-- Custom cell for actions -->
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            :label="t('Edit')"
            color="primary"
            @click="openEditPopup(props.row)"
            flat
            size="sm"
          />
        </q-td>
      </template>
    </q-table>

    <q-btn
      :label="t('Add Employee')"
      color="primary"
      @click="openAddPopup"
      size="sm"
      class="q-my-md"
    />

    <!-- Dialog for adding or editing an employee -->
    <q-dialog v-model="editDialog">
      <q-card style="min-width: 70vw; max-width: 70vw">
        <q-card-section>
          <div class="text-h6">
            {{ t(isEditMode ? "Edit Employee" : "Add Employee") }}
          </div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- Left Column -->
            <div class="col-12 col-md-6 q-gutter-sm">
              <q-input
                v-model="selectedEmployee.employeenumber"
                :label="t('Employee Number')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.name"
                :label="t('Name')"
                outlined
                dense
                required
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.address1"
                :label="t('Address')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.address2"
                :label="t('Address 2')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.city"
                :label="t('City')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.state"
                :label="t('State/Province')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.zipcode"
                :label="t('Zip/Postal Code')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <country-input
                v-model="selectedEmployee.country"
                :label="t('Country')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.email"
                :label="t('E-mail')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <s-select
                v-model="selectedEmployee.acsrole_id"
                :label="t('Role')"
                :options="employeeRoles"
                option-label="description"
                option-value="id"
                emit-value
                map-options
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
                search="description"
              />
              <q-input
                v-model="selectedEmployee.login"
                :label="t('Login')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.password"
                :label="t('Password')"
                type="password"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />

              <q-checkbox
                v-model="selectedEmployee.sales"
                :label="t('Sales')"
                true-value="1"
                :false-value="0"
              />
            </div>
            <!-- Right Column -->
            <div class="col-12 col-md-6 q-gutter-sm">
              <q-input
                v-model="selectedEmployee.workphone"
                :label="t('Work Phone')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.workfax"
                :label="t('Work Fax')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.workmobile"
                :label="t('Work Mobile')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.homephone"
                :label="t('Home Phone')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.homemobile"
                :label="t('Home Mobile')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.startdate"
                :label="t('Start Date')"
                type="date"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.enddate"
                :label="t('End Date')"
                type="date"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.ssn"
                :label="t('SSN')"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.dob"
                :label="t('DOB')"
                type="date"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
              <q-input
                v-model="selectedEmployee.notes"
                :label="t('Notes')"
                type="textarea"
                outlined
                dense
                input-class="maintext"
                label-color="secondary"
              />
            </div>
          </div>

          <!-- Bank Details Section -->
          <div class="q-mt-md q-gutter-sm" v-if="false">
            <div class="text-h6">{{ t("Bank Details") }}</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6 q-gutter-sm">
                <q-input
                  v-model="selectedEmployee.bankname"
                  :label="t('Bank')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.bankaddress1"
                  :label="t('Bank Address')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.bankaddress2"
                  :label="t('Bank Address 2')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.bankcity"
                  :label="t('Bank City')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.bankstate"
                  :label="t('Bank State/Province')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.bankzipcode"
                  :label="t('Bank Zip/Postal Code')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.bankcountry"
                  :label="t('Bank Country')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
              </div>
              <div class="col-12 col-md-6 q-gutter-sm">
                <q-input
                  v-model="selectedEmployee.iban"
                  :label="t('IBAN')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.bic"
                  :label="t('BIC')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.membernumber"
                  :label="t('Member No.')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
                <q-input
                  v-model="selectedEmployee.clearingnumber"
                  :label="t('Clearing No.')"
                  outlined
                  dense
                  input-class="maintext"
                  label-color="secondary"
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions>
          <q-btn flat :label="t('Cancel')" color="negative" v-close-popup />
          <q-btn
            flat
            :label="t('Save')"
            color="positive"
            @click="saveEmployee"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, inject } from "vue";
import { api } from "src/boot/axios";
import { Notify } from "quasar";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// Set page title using the injected updateTitle function
const updateTitle = inject("updateTitle");
updateTitle("Employees");

const employees = ref([]);
const editDialog = ref(false);
const isEditMode = ref(false);
const selectedEmployee = ref({});

// Define table columns for employees
const columns = [
  {
    name: "employeenumber",
    label: t("Employee Number"),
    field: "employeenumber",
    align: "left",
  },
  { name: "name", label: t("Name"), field: "name", align: "left" },
  { name: "email", label: t("E-mail"), field: "email", align: "left" },
  {
    name: "acsrole",
    label: t("Role"),
    field: "acsrole",
    align: "left",
  },
  {
    name: "startdate",
    label: t("Start Date"),
    field: "startdate",
    align: "left",
  },
  { name: "actions", label: t("Actions"), align: "right" },
];

const employeeRoles = ref([]);

// Fetch employees from the API and process the data
const getEmployees = async () => {
  try {
    const response = await api.get("/system/employees");
    // Directly assign the response data to employees
    employees.value = response.data;
  } catch (error) {
    Notify.create({
      message: error.response?.data?.message || t("Can't fetch employees"),
      type: "negative",
      position: "center",
    });
  }
};

const openAddPopup = () => {
  selectedEmployee.value = {
    id: null,
    employeenumber: "",
    name: "",
    address: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    email: "",
    acs: "",
    acsrole_id: "",
    login: "",
    password: "",
    tan: false,
    sales: false,
    workphone: "",
    workfax: "",
    workmobile: "",
    homephone: "",
    homemobile: "",
    startdate: "",
    enddate: "",
    ssn: "",
    dob: "",
    notes: "",
    bankname: "",
    bankaddress1: "",
    bankaddress2: "",
    bankcity: "",
    bankstate: "",
    bankzipcode: "",
    bankcountry: "",
    iban: "",
    bic: "",
    membernumber: "",
    clearingnumber: "",
    referenceDescription: "",
    referenceConfidential: false,
  };
  isEditMode.value = false;
  editDialog.value = true;
};

const openEditPopup = (employee) => {
  // Clone the employee object to avoid modifying table data directly
  selectedEmployee.value = { ...employee };
  isEditMode.value = true;
  editDialog.value = true;
};

const saveEmployee = async () => {
  try {
    // Prepare payload from the form data
    const payload = { ...selectedEmployee.value };

    if (isEditMode.value) {
      await api.post(`/system/employees/${selectedEmployee.value.id}`, payload);
      Notify.create({
        message:
          t("Employee") +
          " " +
          selectedEmployee.value.employeenumber +
          " " +
          t("updated successfully!"),
        type: "positive",
        position: "top-right",
      });
    } else {
      await api.post("/system/employees", payload);
      Notify.create({
        message: t("Employee added successfully!"),
        type: "positive",
        position: "top-right",
      });
    }
    editDialog.value = false;
    getEmployees();
  } catch (error) {
    console.log(error);
  }
};

const fetchLinks = async () => {
  try {
    const response = await api.get("/create_links/employees");
    employeeRoles.value = response.data.roles;
  } catch (error) {
    console.log(error);
  }
};

onMounted(async () => {
  await fetchLinks();
  await getEmployees();
});
</script>
