<script setup lang="ts">
import { ref } from "vue";
import TimeTrack from "./components/TimeTrack.vue";
import { Time } from "./types";

const selectedDate = ref(new Date().toLocaleDateString());

const storedTimes = localStorage.getItem(selectedDate.value);
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
  localStorage.setItem(selectedDate.value, JSON.stringify(updatedTimes));
}
</script>

<template>
  <div class="container my-4">
    <h1>TimeTracker</h1>
    <p class="lead">Dato: {{ selectedDate }}</p>
    <TimeTrack :key="selectedDate" :date="selectedDate" :times="times" @update="onUpdate($event)" />
  </div>
</template>

<style scoped></style>
