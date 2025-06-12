// format 1716218022801 to 29 Apr. 2024 at 15:40 UTC
export const formatDateTime = (dateTime: string) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
    hour12: false,
  };
  const formatter = new Intl.DateTimeFormat("en-GB", options);
  let formattedDate = formatter.format(Number(dateTime));
  formattedDate = formattedDate.replace(/GMT\+0/, "UTC").replace(",", " at");
  return formattedDate;
};
