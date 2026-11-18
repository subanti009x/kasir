import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** Refresh every active view that depends on the changed resource. */
export async function invalidateQueries(queryClient: QueryClient, keys: QueryKey[]) {
  await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function removeItemFromQueries(queryClient: QueryClient, keys: QueryKey[], id: string) {
  for (const queryKey of keys) {
    queryClient.setQueriesData<Array<{ id: string }>>({ queryKey }, (current) =>
      current?.filter((item) => item.id !== id),
    );
  }
}

export const productRelatedKeys: QueryKey[] = [
  ["products"],
  ["products-all"],
  ["inventory"],
  ["low-stock"],
  ["dashboard"],
  ["sales-report"],
  ["profit-loss"],
  ["balance-sheet"],
];

export const transactionRelatedKeys: QueryKey[] = [
  ...productRelatedKeys,
  ["transactions"],
  ["customers"],
];

export const expenseRelatedKeys: QueryKey[] = [
  ["expenses"],
  ["profit-loss"],
  ["balance-sheet"],
  ["dashboard"],
];

export const categoryRelatedKeys: QueryKey[] = [
  ["categories"],
  ["products"],
  ["products-all"],
  ["low-stock"],
];

export const customerRelatedKeys: QueryKey[] = [
  ["customers"],
  ["transactions"],
  ["sales-report"],
  ["dashboard"],
];
