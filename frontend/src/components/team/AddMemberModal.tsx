"use client";

import { useState } from "react";
import {
  UserPlus,
  User,
  Users,
  Shield,
  ShieldAlert,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { MemberCredentialsDialog, MemberCredentials } from "./MemberCredentialsDialog";

export function AddMemberModal({
  onRefresh,
  onMemberCreated,
}: {
  onRefresh: () => void;
  onMemberCreated?: (member: MemberCredentials) => void;
  emailSuffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("USER");

  // Fallback local credentials state if onMemberCreated is not provided
  const [localCredentials, setLocalCredentials] = useState<MemberCredentials | null>(null);
  const [showLocalDialog, setShowLocalDialog] = useState(false);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setRole("USER");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const rawDigits = phoneNumber.replace(/\s+/g, "");
  const fullPhone = `${countryCode} ${rawDigits}`.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (rawDigits.length < 7 || rawDigits.length > 15) {
      toast.error("Please enter a valid phone number (7-15 digits)");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post<MemberCredentials>("/team/members", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: fullPhone,
        role,
      });

      toast.success("Team member account created successfully!");
      resetForm();
      setOpen(false);

      if (onMemberCreated) {
        onMemberCreated(res);
      } else {
        setLocalCredentials(res);
        setShowLocalDialog(true);
      }

      onRefresh();
    } catch (err: unknown) {
      console.error("Failed to create team member:", err);
      const msg = err instanceof Error ? err.message : "Failed to create team member";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={<Button />}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </DialogTrigger>

        <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-2xl">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Add Team Member
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Create a login account directly for your staff. Credentials will be generated for you to share.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mem-first" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  First Name <span className="text-blue-400">*</span>
                </Label>
                <Input
                  id="mem-first"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Rahul"
                  className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mem-last" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Last Name <span className="text-blue-400">*</span>
                </Label>
                <Input
                  id="mem-last"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Sharma"
                  className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white focus:border-blue-500"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="mem-phone" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Mobile Phone <span className="text-blue-400">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="w-20 shrink-0">
                  <Input
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white font-mono text-center text-xs"
                  />
                </div>
                <div className="relative flex-1">
                  <Input
                    id="mem-phone"
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder="98765 43210"
                    maxLength={14}
                    className="h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white font-mono focus:border-blue-500"
                  />
                  <Phone className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Role Select */}
            <div className="space-y-1.5">
              <Label htmlFor="mem-role" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Assign Role <span className="text-blue-400">*</span>
              </Label>
              <Select value={role} onValueChange={(val) => setRole(val ?? role)}>
                <SelectTrigger
                  id="mem-role"
                  className="w-full h-10 rounded-xl bg-zinc-950/70 border-zinc-800 text-white focus:border-blue-500"
                >
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="start"
                  sideOffset={6}
                  className="w-[var(--anchor-width)] min-w-[320px] rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-xl shadow-2xl p-1.5 z-50"
                >
                  <SelectItem value="USER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span>User (Billing, orders, products)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MANAGER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-blue-400 shrink-0" />
                      <span>Manager (Records, inventory, reports)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN" className="rounded-lg py-2 px-2.5 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>Admin (Team management, settings)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="OWNER" className="rounded-lg py-2 px-2.5 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                      <span>Owner (Full unrestricted ownership)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="h-10 rounded-xl border-zinc-800 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-md shadow-blue-500/20"
              >
                Create Member Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {!onMemberCreated && (
        <MemberCredentialsDialog
          open={showLocalDialog}
          onOpenChange={setShowLocalDialog}
          credentials={localCredentials}
          onAddAnother={() => {
            setShowLocalDialog(false);
            setOpen(true);
          }}
        />
      )}
    </>
  );
}
