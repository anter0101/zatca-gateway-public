export type ModalState<T> =
  | {
      type: "create";
    }
  | {
      type: "edit";
      entity: T;
    }
  | {
      type: "delete";
      entity: T;
    }
  | null;
