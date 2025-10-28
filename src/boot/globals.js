import { boot } from "quasar/wrappers";
import SearchSelect from "src/components/inputs/SearchSelect.vue";
import AmountInput from "src/components/inputs/AmountInput.vue";
import TextInput from "src/components/inputs/TextInput.vue";
import DateInput from "src/components/inputs/DateInput.vue";
import Button from "src/components/Button.vue";
import CountryInput from "src/components/inputs/CountryInput.vue";

export default boot(({ app }) => {
  // Register globally so you can <search-select> anywhere
  app.component("s-select", SearchSelect);
  app.component("fn-input", AmountInput);
  app.component("text-input", TextInput);
  app.component("date-input", DateInput);
  app.component("s-button", Button);
  app.component("country-input", CountryInput);
});
