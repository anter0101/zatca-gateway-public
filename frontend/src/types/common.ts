export interface IPaginationInfinityQuery<T> {
  data: T[];
  isPending: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
  totalCount?: number;
}
