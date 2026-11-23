import type { AccountType, TxType } from "./types";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  checking: "Corrente",
  savings: "Reserva",
  credit: "Cartão",
  cash: "Dinheiro",
  investment: "Investimentos",
};

export const TX_LABEL: Record<TxType, string> = {
  income: "Entrada",
  expense: "Saída",
  transfer: "Transferência",
};
