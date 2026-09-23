import axios from "axios";
import qs from "qs";

const timeout = 1000 * 60;

/** Browser → nginx public URL; server (NextAuth authorize) → internal Nest URL. */
const baseURL =
  typeof window === "undefined"
    ? process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL
    : process.env.NEXT_PUBLIC_BACKEND_URL;

const client = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json; charset=UTF-8",
    "ngrok-skip-browser-warning": "true",
  },
  paramsSerializer: (params) =>
    qs.stringify(params, {
      arrayFormat: "repeat",
      skipNulls: true,
    }),
  timeout,
});

export default client;
