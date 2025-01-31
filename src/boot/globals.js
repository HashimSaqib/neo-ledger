import { boot } from "quasar/wrappers";
import SearchSelect from "src/components/inputs/SearchSelect.vue";
import AmountInput from "src/components/inputs/AmountInput.vue";

export default boot(({ app }) => {
  // Register globally so you can <search-select> anywhere
  app.component("s-select", SearchSelect);
  app.component("fn-input", AmountInput);
});
