<script setup lang="ts">
import { ref } from "vue";
import TimeTrack from "./components/TimeTrack.vue";
import { Time } from "./types";
import { computed } from "vue";
import dayjs from "dayjs";

const selectedDate = ref(new Date());
const selectedDateKey = computed(() => dayjs(selectedDate.value).format('YYYY-MM-DD'));
const selectedDateFormatted = computed(() => selectedDate.value.toLocaleDateString());

const storedTimes = localStorage.getItem(selectedDateKey.value);
const deserializer = (str: string): Time[] => {
  const jsonParsedTimes = JSON.parse(str);

  const result: Time[] = [];
  for (const time of jsonParsedTimes) {
    result.push({
      ...time,
      date: new Date(time.date)
    });
  }

  return result;
};

const times = ref<Time[]>(storedTimes ? deserializer(storedTimes) : []);

const onUpdate = (updatedTimes: Time[]) => {
  localStorage.setItem(selectedDateKey.value, JSON.stringify(updatedTimes));
}

const onRefresh = () => {
  const oldKey = selectedDateKey.value;
  selectedDate.value = new Date();
  const newKey = selectedDateKey.value;

  if (oldKey !== newKey) {
    const storedTimes = localStorage.getItem(newKey);
    times.value = storedTimes ? deserializer(storedTimes) : [];
  }
}
</script>

<template>
  <div class="container my-4">
    <h1>TimeTracker</h1>
    <p class="lead d-flex gap-2 align-items-center">
      <span>Dato: {{ selectedDateFormatted }}</span>
      <button type="button" class="btn btn-sm btn-primary" @click="onRefresh()">Refresh</button>
    </p>
    <TimeTrack :key="selectedDateFormatted" :date="selectedDateKey" :times="times" @update="onUpdate($event)" />
  </div>
</template>

<style scoped></style>
