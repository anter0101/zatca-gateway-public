export const MULTI_SELECT_PARAM = "multi-select";

export const isMultiSelectEnabled = (searchParams: URLSearchParams) =>
  searchParams.get(MULTI_SELECT_PARAM) === "1";

export const getParamValues = (
  searchParams: URLSearchParams,
  key: string,
): string[] => {
  const values = searchParams.getAll(key).filter(Boolean);
  if (values.length > 0) {
    return values;
  }

  const value = searchParams.get(key);
  return value ? [value] : [];
};

export const getNumericParamValues = (
  searchParams: URLSearchParams,
  key: string,
): number[] =>
  Array.from(
    new Set(
      getParamValues(searchParams, key)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value)),
    ),
  );

export const setParamValues = (
  params: URLSearchParams,
  key: string,
  values: string[],
) => {
  params.delete(key);
  values.forEach((value) => params.append(key, value));
};

export const toggleParamValue = (
  params: URLSearchParams,
  key: string,
  value: string,
) => {
  const values = getParamValues(params, key);
  const nextValues = values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

  setParamValues(params, key, nextValues);
};
