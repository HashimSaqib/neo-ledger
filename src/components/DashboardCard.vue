<template>
  <!-- Add a wrapper div to control width -->
  <div class="chart-card-wrapper" style="width: 35vw">
    <q-card :class="cardClass">
      <q-card-section>
        <div class="text-h6">{{ title }}</div>
        <div class="text-h5 q-mt-sm text-weight-bold">
          {{ formatAmount(value, currency?.curr) }}
        </div>
        <div class="text-caption text-grey">
          {{ subtitle }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="relative-position" style="height: 200px">
          <q-inner-loading :showing="loading">
            <q-spinner-dots size="50px" color="primary" />
          </q-inner-loading>
          <canvas :id="chartId" ref="chartRef"></canvas>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { Chart, registerables } from "chart.js";
import { ref, onMounted, watch, nextTick, computed } from "vue";
import { formatAmount } from "src/helpers/utils";
import { useQuasar } from "quasar";

const $q = useQuasar();
Chart.register(...registerables);

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  chartId: {
    type: String,
    required: true,
  },
  chartData: {
    type: Object,
    required: true,
    validator: (value) => {
      return (
        value.type &&
        value.data &&
        Array.isArray(value.data.labels) &&
        Array.isArray(value.data.datasets)
      );
    },
  },
  chartOptions: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  currency: {
    type: Object,
    default: null,
  },
  // Add new width prop
  width: {
    type: String,
    default: "100%",
  },
  // Add new class prop for additional styling flexibility
  cardClass: {
    type: [String, Object, Array],
    default: "",
  },
});

const chartRef = ref(null);
let chart = null;

const initChart = () => {
  if (chart) {
    chart.destroy();
  }
  const ctx = chartRef.value.getContext("2d");
  if (!props.chartData || !props.chartData.data) {
    console.warn("Chart data is not properly structured");
    return;
  }
  const chartConfig = {
    type: props.chartData.type,
    data: props.chartData.data,
    options: props.chartOptions,
  };
  chart = new Chart(ctx, chartConfig);
};

onMounted(() => {
  initChart();
});

watch(
  () => $q.dark.isActive,
  async (val) => {
    await nextTick();
    initChart();
  }
);

watch(
  [() => props.chartData, () => props.currency],
  () => {
    console.log("value change");
    initChart();
  },
  { deep: true }
);
</script>

<style scoped>
.chart-card-wrapper {
  margin: 0 auto;
}
</style>
