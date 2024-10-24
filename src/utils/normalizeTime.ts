/** @format */

import moment from "moment-timezone";

const TIMEZONE = "Asia/Colombo";

const formats = [
  moment.ISO_8601,
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM/DD/YYYY",
  "MMMM D, YYYY",
  "YYYY/MM/DD",
  "YYYY-MM-DDTHH:mm:ssZ",
  "HH:mm:ss",
  "MM-DD-YYYY HH:mm",
  "DD/MM/YYYY HH:mm",
  "MMMM D, YYYY h:mm a",
];

const normalizeTime = (input: string) => {
  let date;

  if (input.includes("ago")) {
    date = moment().tz(TIMEZONE);

    date = moment(input, "mm [minutes] ago").isValid()
      ? moment().subtract(parseInt(input.split(" ")[0]), "minutes")
      : moment(input, "h [hours] ago").isValid()
      ? moment().subtract(parseInt(input.split(" ")[0]), "hours")
      : moment(input, "d [days] ago").isValid()
      ? moment().subtract(parseInt(input.split(" ")[0]), "days")
      : date;
  } else {
    date = moment.tz(input, formats, true, TIMEZONE);
  }
  if (!date.isValid()) {
    date = moment().tz(TIMEZONE);
  }

  return date.tz(TIMEZONE).format();
};

export default normalizeTime;
