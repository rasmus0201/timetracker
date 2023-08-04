<script setup lang="ts">
import { computed, ref } from "vue";
import { Time, TimeType, TimeState, TimePeriod } from "../types";

const props = defineProps<{
  date: string;
  times: Time[];
}>();

const emit = defineEmits<{
  (e: "update", times: Time[]): void;
}>();

const timeTypeLabels: { [key in TimeType]: any } = {
  [TimeType.Start]: "Started",
  [TimeType.PauseStart]: "Pause",
  [TimeType.PauseEnd]: "Started",
  [TimeType.End]: "End",
};

const timeStateMap: { [key in TimeType]: any } = {
  [TimeType.Start]: TimeState.Started,
  [TimeType.PauseStart]: TimeState.Paused,
  [TimeType.PauseEnd]: TimeState.Started,
  [TimeType.End]: TimeState.Stopped,
};

const language = navigator.language;

const times = ref<Time[]>(props.times);

const state = computed<TimeState>(() => {
  if (times.value.length === 0) {
    return TimeState.Stopped;
  }

  const timeType = times.value[times.value.length - 1].type;
  return timeStateMap[timeType];
});

const calculateDuration = (
  a: Date,
  b: Date,
  period: TimePeriod,
  round: false|number = false
): number => {
  const duration = (a.getTime() - b.getTime()) / period;

  if (round !== false) {
    return Number(duration.toFixed(round));
  }

  return duration;
};

const hasPaused = computed(
  () =>
    times.value.some((t) => t.type === TimeType.PauseStart) &&
    times.value.some((t) => t.type === TimeType.PauseEnd)
);
const endTime = computed(() =>
  [...times.value].reverse().find((t) => t.type === TimeType.End)
);

const totalPauseTimeHours = computed(() => {
  let totalMs = 0;

  let currentPauseStart: Date | null = null;
  for (const time of times.value) {
    if (time.type === TimeType.PauseStart) {
      currentPauseStart = time.date;
    }

    if (currentPauseStart && time.type === TimeType.PauseEnd) {
      totalMs += calculateDuration(time.date, currentPauseStart, TimePeriod.Millisecond, false);
      currentPauseStart = null;
    }
  }

  return (totalMs / TimePeriod.Hour).toFixed(2);
});

const onReset = () => {
  if (!window.confirm("Sure?")) {
    return;
  }

  times.value = [];

  emit("update", times.value);
};

const onStart = () => {
  if (times.value.length) {
    if (!window.confirm("Sure? This will delete current times for the day!")) {
      return;
    }
  }

  times.value = [
    {
      type: TimeType.Start,
      date: new Date(),
    },
  ];

  emit("update", times.value);
};

const onPause = () => {
  times.value.push({
    type: TimeType.PauseStart,
    date: new Date(),
  });

  emit("update", times.value);
};

const onUnPause = () => {
  times.value.push({
    type: TimeType.PauseEnd,
    date: new Date(),
  });

  emit("update", times.value);
};

const onStop = () => {
  times.value.push({
    type: TimeType.End,
    date: new Date(),
  });

  emit("update", times.value);
};
</script>

<template>
  <div>
    <div class="row mb-3">
      <div class="col-12">
        <div class="d-flex gap-3">
          <button
            v-if="times.length"
            class="btn btn-lg btn-warning"
            @click="onReset()"
          >
            Reset
          </button>
          <button
            v-if="state === TimeState.Stopped"
            class="btn btn-lg btn-primary"
            @click="onStart()"
          >
            Start
          </button>
          <button
            v-if="state === TimeState.Started"
            class="btn btn-lg btn-secondary"
            @click="onPause()"
          >
            Pause
          </button>
          <button
            v-if="state === TimeState.Paused"
            class="btn btn-lg btn-secondary active"
            @click="onUnPause()"
          >
            Unpause
          </button>
          <button
            v-if="[TimeState.Started, TimeState.Paused].includes(state)"
            class="btn btn-lg btn-danger"
            @click="onStop()"
          >
            Stop
          </button>
        </div>
      </div>
    </div>

    <div class="row" v-if="times.length">
      <div class="col-12">
        <div class="d-flex gap-2">
          <span class="badge bg-primary">
            Start:
            {{
              times[0].date.toLocaleTimeString(language, {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
          </span>
          <span v-if="endTime" class="badge bg-primary">
            End:
            {{
              endTime.date.toLocaleTimeString(language, {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
          </span>
          <span v-if="hasPaused" class="badge bg-primary">
            Pause time: {{ totalPauseTimeHours.toLocaleString() }}hr
          </span>
        </div>
      </div>
      <div class="col-12">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th scope="col">Type</th>
                <th scope="col">Start</th>
                <th scope="col">End</th>
                <th scope="col">Duration (hrs)</th>
              </tr>
            </thead>
            <tbody class="table-group-divider">
              <tr v-for="(time, index) in times" :key="index">
                <td>{{ timeTypeLabels[time.type] }}</td>
                <td>{{ time.date.toLocaleTimeString() }}</td>
                <td>
                  <template v-if="times[index + 1]">
                    {{ times[index + 1].date.toLocaleTimeString() }}
                  </template>
                </td>
                <td>
                  <template v-if="time.type === TimeType.PauseStart && times[index + 1]">
                    {{
                      calculateDuration(
                        times[index + 1].date,
                        time.date,
                        TimePeriod.Hour,
                        2
                      )
                    }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
