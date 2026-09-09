"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// --- Types ---

export interface CollectionQrCode {
  id: string;
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  nickname: string;
  qrImageUrl?: string;
  isActive: boolean;
}

export interface CollectionPayment {
  id: string;
  customerId?: string;
  customerName?: string;
  qrCodeId: string;
  qrCodeNickname: string;
  recordedById: string;
  recordedByEmail: string;
  qrOwnerId: string;
  qrOwnerEmail: string;
  amount: number;
  place: string;
  recordedAt: string;
  utrNumber?: string;
  referenceNumber?: string;
  screenshotUrl?: string;
  status: string;
  verifiedById?: string;
  verifiedAt?: string;
  remarks?: string;
}

export interface CollectionExpense {
  id: string;
  userId: string;
  userEmail: string;
  category: string;
  vendor: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  attachmentUrl?: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
}

export interface SettlementDeposit {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  depositDate: string;
  referenceNumber: string;
  notes?: string;
  attachmentUrl?: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
}

export interface CollectionLedgerEntry {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  amount: number;
  referenceId: string;
  notes?: string;
  createdAt: string;
}

export interface OwnerDashboard {
  totalOutstandingCollections: number;
  pendingVerificationCount: number;
  pendingVerificationSum: number;
  collectionsToday: number;
  depositsToday: number;
  expensesToday: number;
  topCollectors: Array<{ email: string; name: string; amount: number }>;
  highOutstandingUsers: Array<{ email: string; name: string; amount: number }>;
}

export interface UserDashboard {
  currentCollectionBalance: number;
  pendingVerificationCount: number;
  todayCollections: number;
  todayExpenses: number;
  todayDeposits: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  readAt?: string;
  createdAt: string;
}

// --- QR Codes ---

export function useQrCodes() {
  return useQuery<CollectionQrCode[]>({
    queryKey: ["collection-qr-codes"],
    queryFn: () => api.get("/collections/qr"),
  });
}

export function useCreateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CollectionQrCode>) =>
      api.post<CollectionQrCode>("/collections/qr", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collection-qr-codes"] }),
  });
}

export function useUpdateQrCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<CollectionQrCode> & { id: string }) =>
      api.put<CollectionQrCode>(`/collections/qr/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collection-qr-codes"] }),
  });
}

// --- Payments ---

export function useCollectionPayments() {
  return useQuery<CollectionPayment[]>({
    queryKey: ["collection-payments"],
    queryFn: () => api.get("/collections/payments"),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CollectionPayment>) =>
      api.post<CollectionPayment>("/collections/payments", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection-payments"] });
      qc.invalidateQueries({ queryKey: ["collection-dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verify, remarks }: { id: string; verify: boolean; remarks?: string }) =>
      api.post(`/collections/payments/${id}/verify`, { verify, remarks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection-payments"] });
      qc.invalidateQueries({ queryKey: ["collection-dashboard"] });
      qc.invalidateQueries({ queryKey: ["collection-ledger"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

// --- Expenses ---

export function useCollectionExpenses() {
  return useQuery<CollectionExpense[]>({
    queryKey: ["collection-expenses"],
    queryFn: () => api.get("/collections/expenses"),
  });
}

export function useRecordExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CollectionExpense>) =>
      api.post<CollectionExpense>("/collections/expenses", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection-expenses"] });
      qc.invalidateQueries({ queryKey: ["collection-dashboard"] });
    },
  });
}

export function useApproveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post(`/collections/expenses/${id}/approve`, { approve }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection-expenses"] });
      qc.invalidateQueries({ queryKey: ["collection-dashboard"] });
      qc.invalidateQueries({ queryKey: ["collection-ledger"] });
    },
  });
}

// --- Deposits ---

export function useSettlementDeposits() {
  return useQuery<SettlementDeposit[]>({
    queryKey: ["collection-deposits"],
    queryFn: () => api.get("/collections/deposits"),
  });
}

export function useRecordDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SettlementDeposit>) =>
      api.post<SettlementDeposit>("/collections/deposits", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection-deposits"] });
      qc.invalidateQueries({ queryKey: ["collection-dashboard"] });
    },
  });
}

export function useApproveDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post(`/collections/deposits/${id}/approve`, { approve }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collection-deposits"] });
      qc.invalidateQueries({ queryKey: ["collection-dashboard"] });
      qc.invalidateQueries({ queryKey: ["collection-ledger"] });
    },
  });
}

// --- Ledger ---

export function useCollectionLedger() {
  return useQuery<CollectionLedgerEntry[]>({
    queryKey: ["collection-ledger"],
    queryFn: () => api.get("/collections/ledger"),
  });
}

// --- Dashboard ---

export function useOwnerDashboard() {
  return useQuery<OwnerDashboard>({
    queryKey: ["collection-dashboard", "owner"],
    queryFn: () => api.get("/collections/dashboard/owner"),
  });
}

export function useUserDashboard() {
  return useQuery<UserDashboard>({
    queryKey: ["collection-dashboard", "user"],
    queryFn: () => api.get("/collections/dashboard/user"),
  });
}

// --- Notifications ---

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications"),
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
