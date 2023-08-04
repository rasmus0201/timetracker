export enum TimeState {
  Stopped = "stopped",
  Started = "started",
  Paused = "paused",
}

export enum TimeType {
  Start = "start",
  PauseStart = "pause-start",
  PauseEnd = "pause-end",
  End = "end",
}

export enum TimePeriod {
  Millisecond = 1,
  Second = 1_000,
  Minute = 60_000,
  Hour = 3_600_000,
}

export type Time = {
  type: TimeType;
  date: Date;
};
