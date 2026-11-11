import { AsyncLocalStorage } from 'node:async_hooks';
export const transactionContext = new AsyncLocalStorage();
export const currentTransactionSession = () => transactionContext.getStore();
