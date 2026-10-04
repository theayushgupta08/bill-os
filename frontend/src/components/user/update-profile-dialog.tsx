"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { CURRENT_USER_KEY } from "@/lib/use-current-user";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserProfile, UpdateProfileRequest } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface UpdateProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAvatar?: string;
  onProfileUpdated?: (updated: { firstName: string; lastName: string; fullName: string; phone?: string | null }) => void;
}

export function UpdateProfileDialog({
  open,
  onOpenChange,
  userAvatar,
  onProfileUpdated,
}: UpdateProfileDialogProps) {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      return await api.get<UserProfile>("/users/me");
    },
    enabled: open,
  });

  // Copy freshly fetched data into the editable form state (render-time sync instead of an effect)
  const [syncedProfile, setSyncedProfile] = useState<typeof profile>(undefined);
  if (profile && profile !== syncedProfile) {
    setSyncedProfile(profile);
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setPhone(profile.phone || "");
    setEmail(profile.email || "");
  }

  const updateMutation = useMutation({
    mutationFn: async (payload: UpdateProfileRequest) => {
      return await api.put<UserProfile>("/users/me", payload);
    },
    onSuccess: async (updated) => {
      // Sync Supabase user metadata
      try {
        // Created on demand, not during render: prerendering at build time has no Supabase env
        await createClient().auth.updateUser({
          data: {
            first_name: updated.firstName,
            last_name: updated.lastName,
            full_name: `${updated.firstName} ${updated.lastName}`.trim(),
            name: `${updated.firstName} ${updated.lastName}`.trim(),
          },
        });
      } catch {
        // Non-fatal if Supabase metadata update fails
      }

      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      queryClient.invalidateQueries({ queryKey: ["team"] });

      const fullName = `${updated.firstName} ${updated.lastName}`.trim();
      if (onProfileUpdated) {
        onProfileUpdated({
          firstName: updated.firstName,
          lastName: updated.lastName,
          fullName,
          phone: updated.phone,
        });
      }

      toast.success("Profile updated successfully!");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile details. Please verify your inputs.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required.");
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone && !/^\+\d{1,4} ?\d{4,14}$/.test(trimmedPhone)) {
      toast.error("Phone number must be in international format (e.g. +91 9876543210).");
      return;
    }

    updateMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: trimmedPhone || null,
    });
  };

  const userInitials = (
    `${firstName.charAt(0) || ""}${lastName.charAt(0) || ""}` ||
    (email ? email.charAt(0) : "U")
  ).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-slate-950 border-slate-800 text-slate-100 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                Personal Profile
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-0.5">
                Update your personal name and contact information.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs text-slate-400 font-medium">Loading profile details...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* User Identity Banner */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-800 bg-slate-900/50">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {firstName || lastName ? `${firstName} ${lastName}`.trim() : "User Account"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <p className="text-xs text-slate-400 truncate">{email || "No email"}</p>
                </div>
              </div>
              <div className="flex items-center text-emerald-400" title="Email Verified">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="profile-firstName" className="text-xs font-semibold text-slate-300">
                  First Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="profile-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Ayush"
                  required
                  className="bg-slate-900/80 border-slate-800 text-xs h-9 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profile-lastName" className="text-xs font-semibold text-slate-300">
                  Last Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  id="profile-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Gupta"
                  required
                  className="bg-slate-900/80 border-slate-800 text-xs h-9 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="profile-email" className="text-xs font-semibold text-slate-300">
                  Email Address
                </Label>
                <span className="text-[10px] text-slate-500">Managed via Auth Provider</span>
              </div>
              <div className="relative">
                <Input
                  id="profile-email"
                  value={email}
                  readOnly
                  disabled
                  className="bg-slate-900/40 border-slate-800/80 text-xs h-9 text-slate-400 cursor-not-allowed pl-8"
                />
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone" className="text-xs font-semibold text-slate-300">
                Phone Number
              </Label>
              <div className="relative">
                <Input
                  id="profile-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  pattern="^(\+\d{1,4} ?\d{4,14})?$"
                  title="Format: Country Code + Phone (e.g. +91 9876543210)"
                  className="bg-slate-900/80 border-slate-800 text-xs h-9 pl-8 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-500">
                Include country code (e.g. +91 9876543210). Used for operational notifications.
              </p>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 h-9 shadow-sm"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
