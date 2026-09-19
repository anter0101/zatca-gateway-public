import axios from "axios";
import qs from "qs";

const timeout = 1000 * 60;

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json; charset=UTF-8",
    "ngrok-skip-browser-warning": "true",
    // "X-TENANT-ID": "dms",
  },
  paramsSerializer: (params) =>
    qs.stringify(params, {
      arrayFormat: "repeat", // 👈 KEY PART
      skipNulls: true, // remove null/undefined
    }),

  timeout,
});

export default client;
