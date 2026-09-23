import type { AxiosError } from "axios";
import { isAxiosError } from "axios";

import type { ApiErrorBody, IApiResError } from "@/types/api-res-error";
import { ApiErrorCode } from "@/types/api-res-error";

type TranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

function isKnownApiErrorCode(code: string): code is ApiErrorCode {
  return (Object.values(ApiErrorCode) as string[]).includes(code);
}

export function getApiErrorBody(
  error: AxiosError<IApiResError> | Error | null | undefined,
): ApiErrorBody | null {
  if (!error || !isAxiosError(error)) {
    return null;
  }

  const axiosError = error as AxiosError<IApiResError>;
  const body = axiosError.response?.data?.error;

  if (
    !body ||
    typeof body.code !== "string" ||
    typeof body.message !== "string"
  ) {
    return null;
  }

  return body;
}

export function getApiErrorMessage(
  error: AxiosError<IApiResError> | Error | null | undefined,
  t: TranslateFn,
): string {
  const body = getApiErrorBody(error);

  if (body) {
    if (isKnownApiErrorCode(body.code)) {
      return t(`errors.codes.${body.code}`);
    }

    if (body.message.trim().length > 0) {
      return body.message;
    }
  }

  return t("message.on-error");
}
