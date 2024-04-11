<script setup lang="ts">
import { computed, ref } from "vue";
import { Time, TimeType, TimeState, TimePeriod } from "../types";
import dayjs from "dayjs";

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
const LUNCH_BREAK_DURATION_SECONDS = 30 * 60; // 30 minutes

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
  round: false | number = false
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
const startDate = computed(() =>
  times.value.find((t) => t.type === TimeType.Start)
);
const endDate = computed(() =>
  [...times.value].reverse().find((t) => t.type === TimeType.End)
);

const totalPauseTimeSeconds = computed(() => {
  // Dependency to trigger changes if activeEditTime is updated.
  activeEditTime.value;

  let totalMs = 0;

  let currentPauseStart: Date | null = null;
  for (const time of times.value) {
    if (time.type === TimeType.PauseStart) {
      currentPauseStart = time.date;
    }

    if (currentPauseStart && time.type === TimeType.PauseEnd) {
      totalMs += calculateDuration(
        time.date,
        currentPauseStart,
        TimePeriod.Millisecond
      );
      currentPauseStart = null;
    }
  }

  return totalMs / TimePeriod.Second;
});

const totalWorkTime = computed(() => {
  if (!startDate.value || !endDate.value) {
    return 0;
  }

  const totalTime = calculateDuration(endDate.value.date, startDate.value.date, TimePeriod.Millisecond) / TimePeriod.Second;

  return totalTime - totalPauseTimeSeconds.value;
});

const totalWorkTimeHours = computed(() => {
  return totalWorkTime.value / (TimePeriod.Hour / TimePeriod.Second);
});

const totalWorkTimeWithoutLunchBreakHours = computed(() => {
  return (totalWorkTime.value - LUNCH_BREAK_DURATION_SECONDS) / (TimePeriod.Hour / TimePeriod.Second);
});

const totalPauseTimeHours = computed(() => {
  return totalPauseTimeSeconds.value / (TimePeriod.Hour / TimePeriod.Second);
});

type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const dayToWorkTimeSeconds: { [key in WeekDay]: number } = {
  0: 0,
  1: 27_000, // 7.5hrs
  2: 27_000, // 7.5hrs
  3: 27_000, // 7.5hrs
  4: 27_000, // 7.5hrs
  5: 25_200, // 7 hours
  6: 0,
};

const workTime = computed(() => {
  const day = dayjs(props.date).day() as WeekDay;

  return dayToWorkTimeSeconds[day];
});

const projectedEndDate = computed(() => {
  if (!startDate.value) {
    return null;
  }

  return dayjs(startDate.value.date).second(workTime.value + totalPauseTimeSeconds.value);
});

const onReset = () => {
  if (!window.confirm("Sure?")) {
    return;
  }

  times.value = [];

  emit("update", times.value);
};

const onStart = () => {
  // if (times.value.length) {
  //   if (!window.confirm("Sure? This will delete current times for the day!")) {
  //     return;
  //   }
  // }

  times.value.push({
    type: TimeType.Start,
    date: new Date(),
  });

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

const activeEditTime = ref<number | null>(null);
const onEditTime = (index: number) => {
  activeEditTime.value = index;
};

type EventWithValue = FocusEvent & { target: { value: string } };

const onSaveEditTime = (event: EventWithValue, timeIndex: number) => {
  const timeParts = event.target.value.split(":");

  if (timeParts.length < 2) {
    return;
  }

  times.value[timeIndex].date.setHours(parseInt(timeParts[0]));
  times.value[timeIndex].date.setMinutes(parseInt(timeParts[1]));

  if (timeParts.length === 3) {
    times.value[timeIndex].date.setSeconds(parseInt(timeParts[2]));
  }

  activeEditTime.value = null;
  emit("update", times.value);
};
</script>

<template>
  <div>
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex gap-2 flex-wrap">
          <button
            v-if="times.length"
            class="btn btn-lg btn-warning"
            @click="onReset()"
          >
            Reset
          </button>
          <button
            v-if="[TimeState.Started, TimeState.Stopped].includes(state)"
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

    <div class="row" v-if="startDate">
      <div class="col-12 d-flex flex-column gap-2">
        <div class="d-flex gap-2 flex-wrap">
          <span class="badge bg-primary">
            Start:
            {{
              startDate.date.toLocaleTimeString(language, {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
          </span>
          <span v-if="endDate" class="badge bg-primary">
            End:
            {{
              endDate.date.toLocaleTimeString(language, {
                hour: "2-digit",
                minute: "2-digit",
              })
            }}
          </span>
          <span v-if="hasPaused" class="badge bg-primary">
            Pause time: {{ totalPauseTimeHours.toFixed(2).toLocaleString() }}hrs
          </span>
        </div>

        <div class="d-flex gap-2 flex-wrap">
          <span v-if="projectedEndDate" class="badge bg-success">
            Projected end time: {{ projectedEndDate.format("HH:mm") }}
          </span>
          <span v-if="totalWorkTimeHours > 0" class="badge bg-success">
            Total duration: {{ totalWorkTimeHours.toFixed(2).toLocaleString() }}hrs
          </span>
          <span v-if="totalWorkTimeWithoutLunchBreakHours > 0" class="badge bg-success">
            Assignments duration (w/o lunch break): {{ totalWorkTimeWithoutLunchBreakHours.toFixed(2).toLocaleString() }}hrs
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
                <td @dblclick="onEditTime(index)">
                  <div v-if="activeEditTime === index" class="d-flex gap-2">
                    <input
                      type="time"
                      class="form-control"
                      :value="
                        time.date.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })
                      "
                      @blur="onSaveEditTime($event as EventWithValue, index)"
                    />
                  </div>
                  <span v-else>{{ time.date.toLocaleTimeString() }}</span>
                </td>
                <td>
                  <template v-if="times[index + 1]">
                    {{ times[index + 1].date.toLocaleTimeString() }}
                  </template>
                </td>
                <td>
                  <template v-if="times[index + 1]">
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
