/** @format */

import moment from "moment-timezone";

// Function to convert a timestamp string to ISO format in a specified timezone
const convertToISO = (relativeTime: string, timezone: string) => {
  let date;

  // Regex pattern to match the timestamp format
  const datePattern = /^[A-Za-z]+ \d{1,2}, \d{4} {1,2}\d{1,2}:\d{2} [ap]m$/;

  // Check if the input is an absolute timestamp
  if (datePattern.test(relativeTime)) {
    // Handle the timestamp, replacing multiple spaces with a single space
    date = moment.tz(
      relativeTime.replace(/ {2,}/g, " "),
      "MMMM DD, YYYY h:mm a",
      timezone
    );
  } else {
    // Handle relative timestamps (like "2 hours ago")
    const timeParts = relativeTime.split(" ");
    const value = parseInt(timeParts[0], 10);
    const unit = timeParts[1];

    if (unit.includes("hour")) {
      date = moment().tz(timezone).subtract(value, "hours");
    } else if (unit.includes("day")) {
      date = moment().tz(timezone).subtract(value, "days");
    } else if (unit.includes("minute")) {
      date = moment().tz(timezone).subtract(value, "minutes");
    } else {
      date = moment().tz(timezone); // Current time for unexpected formats
    }
  }

  return date.toISOString(); // Return ISO formatted string
};

export default convertToISO;
