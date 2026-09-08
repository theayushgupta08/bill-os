"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Check,
  Plus,
  Settings,
  Building2,
  GitBranch,
  Crown,
  ExternalLink,
} from "lucide-react";
import {
  useOrganization,
  useOrganizationTree,
  useMyOrganizations,
  getOrgInitials,
  getOrgGradient,
  switchActiveOrganization,
  Organization,
} from "@/lib/use-organization";
import { CreateBranchDialog } from "./create-branch-dialog";

export function OrganizationSwitcher() {
  const { data: currentOrg, isLoading } = useOrganization();
  const { data: orgTree } = useOrganizationTree();
  const { data: allOrgs } = useMyOrganizations();

  const [isOpen, setIsOpen] = useState(false);
  const [createBranchOpen, setCreateBranchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = getOrgInitials(currentOrg?.name);
  const gradient = getOrgGradient(currentOrg?.name);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const websiteUrl = currentOrg?.website?.trim()
    ? currentOrg.website.startsWith("http://") || currentOrg.website.startsWith("https://")
      ? currentOrg.website
      : `https://${currentOrg.website}`
    : null;

  // Identify the Primary Parent Org for branch creation
  const primaryOrg =
    orgTree?.find((t) => t.primaryOrganization.id === currentOrg?.id || t.primaryOrganization.id === currentOrg?.parentOrganizationId)?.primaryOrganization ||
    allOrgs?.find((o) => o.isPrimary || !o.parentOrganizationId) ||
    currentOrg;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Switcher Button Header */}
      <div className="flex items-center gap-2 h-[60px] px-3 border-b border-border/40 flex-shrink-0 bg-slate-950">
        {/* Org Logo / Avatar with optional website link */}
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Visit ${currentOrg?.name || "Organization"} (${currentOrg?.website})`}
            onClick={(e) => e.stopPropagation()}
            className={`w-8 h-8 rounded-lg ${
              currentOrg?.logoUrl
                ? "bg-slate-900 border border-slate-700/80 p-0.5"
                : `bg-gradient-to-br ${gradient}`
            } flex items-center justify-center flex-shrink-0 shadow-md transition-transform hover:scale-105 hover:opacity-90 cursor-pointer overflow-hidden group`}
          >
            {currentOrg?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentOrg.logoUrl}
                alt={currentOrg.name || "Organization Logo"}
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <span className="text-white text-xs font-bold tracking-tight">
                {isLoading ? "…" : initials}
              </span>
            )}
          </a>
        ) : (
          <div
            className={`w-8 h-8 rounded-lg ${
              currentOrg?.logoUrl
                ? "bg-slate-900 border border-slate-700/80 p-0.5"
                : `bg-gradient-to-br ${gradient}`
            } flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden cursor-default`}
          >
            {currentOrg?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentOrg.logoUrl}
                alt={currentOrg.name || "Organization Logo"}
                className="w-full h-full object-contain rounded-md"
              />
            ) : (
              <span className="text-white text-xs font-bold tracking-tight">
                {isLoading ? "…" : initials}
              </span>
            )}
          </div>
        )}

        {/* Org Info & Switcher Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex-1 min-w-0 flex items-center justify-between text-left group p-1 -m-1 rounded-md hover:bg-slate-900/80 transition-colors cursor-pointer"
        >
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5 leading-tight">
              <p className="text-sm font-semibold text-white truncate">
                {isLoading ? (
                  <span className="animate-pulse bg-slate-700 rounded h-3 w-20 inline-block" />
                ) : (
                  currentOrg?.name || "Your Business"
                )}
              </p>
              {currentOrg?.isPrimary || !currentOrg?.parentOrganizationId ? (
                <span
                  title="Official Primary Parent Organization"
                  className="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1 rounded flex-shrink-0"
                >
                  👑 Primary
                </span>
              ) : (
                <span
                  title={`Branch: ${currentOrg?.branchCode || "Subsidiary"}`}
                  className="inline-flex items-center text-[10px] font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-1 rounded flex-shrink-0"
                >
                  🏢 {currentOrg?.branchCode || "Branch"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
              {currentOrg?.gstin ? `GSTIN: ${currentOrg.gstin}` : "billOS Cloud"}
            </p>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180 text-indigo-400" : ""
            }`}
          />
        </button>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[64px] left-2 right-2 z-50 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden text-sm animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/50 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Corporate Organizations & Branches
            </span>
            <span className="text-[10px] text-indigo-400 font-medium">
              Hub & Spoke
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
            {/* Render from Organization Tree if available, or fallback to flat list */}
            {orgTree && orgTree.length > 0 ? (
              orgTree.map((tree) => {
                const isParentActive = tree.primaryOrganization.id === currentOrg?.id;

                return (
                  <div key={tree.primaryOrganization.id} className="space-y-1">
                    {/* Primary Parent Organization Item */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        if (!isParentActive) switchActiveOrganization(tree.primaryOrganization.id);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                        isParentActive
                          ? "bg-indigo-500/15 border border-indigo-500/30 text-white"
                          : "hover:bg-slate-800/70 text-slate-300"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-md bg-gradient-to-br ${getOrgGradient(
                          tree.primaryOrganization.name
                        )} flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0`}
                      >
                        👑
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs truncate">
                            {tree.primaryOrganization.name}
                          </span>
                          <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Primary
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {tree.primaryOrganization.gstin || "Master Organization"}
                        </p>
                      </div>
                      {isParentActive && (
                        <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      )}
                    </button>

                    {/* Secondary Branches */}
                    {tree.branches && tree.branches.length > 0 && (
                      <div className="pl-4 space-y-1 border-l-2 border-slate-800 ml-3.5 my-1">
                        {tree.branches.map((branch) => {
                          const isBranchActive = branch.id === currentOrg?.id;

                          return (
                            <button
                              key={branch.id}
                              type="button"
                              onClick={() => {
                                setIsOpen(false);
                                if (!isBranchActive) switchActiveOrganization(branch.id);
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all ${
                                isBranchActive
                                  ? "bg-cyan-500/15 border border-cyan-500/30 text-white"
                                  : "hover:bg-slate-800/70 text-slate-300"
                              }`}
                            >
                              <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-[10px] font-semibold flex-shrink-0">
                                🏢
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-xs truncate">
                                    {branch.name}
                                  </span>
                                  {branch.branchCode && (
                                    <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20">
                                      {branch.branchCode}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {branch.city || branch.state ? `${branch.city || ""}, ${branch.state || ""}` : branch.gstin || "Branch"}
                                </p>
                              </div>
                              {isBranchActive && (
                                <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : allOrgs && allOrgs.length > 0 ? (
              allOrgs.map((org) => {
                const isActive = org.id === currentOrg?.id;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (!isActive) switchActiveOrganization(org.id);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-indigo-500/15 border border-indigo-500/30 text-white"
                        : "hover:bg-slate-800/70 text-slate-300"
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-md bg-gradient-to-br ${getOrgGradient(
                        org.name
                      )} flex items-center justify-center text-white text-[10px] font-bold shadow-sm flex-shrink-0`}
                    >
                      {org.isPrimary ? "👑" : "🏢"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs truncate">
                          {org.name}
                        </span>
                        {org.isPrimary && (
                          <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {org.gstin || (org.isPrimary ? "Primary Organization" : "Branch")}
                      </p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 p-2 text-center">Loading organizations...</p>
            )}
          </div>

          {/* Quick Actions Footer */}
          <div className="p-1.5 border-t border-slate-800/80 bg-slate-950/40 space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setCreateBranchOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:text-white hover:bg-indigo-600/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create New Branch / Subsidiary</span>
            </button>

            <Link
              href="/settings/organization"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Organizations & Branches Settings</span>
              </span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </Link>
          </div>
        </div>
      )}

      {/* Create Branch Modal */}
      {primaryOrg && (
        <CreateBranchDialog
          open={createBranchOpen}
          onOpenChange={setCreateBranchOpen}
          parentOrg={primaryOrg}
        />
      )}
    </div>
  );
}
