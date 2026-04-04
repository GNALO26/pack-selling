import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (amount: number, currency = 'XOF') => {
  return new Intl.NumberFormat('fr-BJ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('fr-BJ', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
};

export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: string } } };
    return axiosError.response?.data?.error || 'Une erreur est survenue.';
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue.';
};

export const truncate = (str: string, n: number) =>
  str.length > n ? str.slice(0, n - 1) + '...' : str;
