const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const longDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const DIVISIONS = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

const toDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatRelativeTime = (value) => {
  const date = toDate(value);
  if (!date) return "Unknown";

  let duration = (date.getTime() - Date.now()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeTimeFormatter.format(
        Math.round(duration),
        division.unit,
      );
    }
    duration /= division.amount;
  }

  return relativeTimeFormatter.format(Math.round(duration), "year");
};

export const formatDate = (value) => {
  const date = toDate(value);
  return date ? longDateFormatter.format(date) : "Unknown";
};

export const formatDateTime = (value) => {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : "Unknown";
};
