"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Search } from "lucide-react";

import CreateSystemOwnerForm from "@/components/system-owners/create-system-owner-form";
import DeleteSystemOwnerForm from "@/components/system-owners/delete-system-owner-form";
import EditSystemOwnerForm from "@/components/system-owners/edit-system-owner-form";
import SystemOwnersTable from "@/components/system-owners/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetSystemOwners } from "@/hooks/system-owners/get-all";
import { useFilters } from "@/hooks/use-filters";
import type { ModalState } from "@/types/modal";
import type {
  SystemOwner,
  SystemOwnerStatusFilter,
} from "@/types/system-owner";
import { systemOwnerStatusOptions } from "@/types/system-owner";

const PAGE_SIZE = 5;

export default function SystemOwners() {
  const t = useTranslations("system-owners");
  const { data: owners = [], isPending } = useGetSystemOwners();
  const [openModal, setOpenModal] = useState<ModalState<SystemOwner>>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<SystemOwnerStatusFilter>("all");

  const filters = useMemo(() => {
    if (selectedStatus === "all") {
      return [];
    }
    return [(owner: SystemOwner) => owner.status === selectedStatus];
  }, [selectedStatus]);

  const {
    currentPage,
    filteredData,
    paginatedData,
    setCurrentPage,
    resetPage,
  } = useFilters<SystemOwner>({
    data: owners,
    pageSize: PAGE_SIZE,
    filters,
    searchValue,
    searchFn: (owner, search) =>
      owner.name.toLowerCase().includes(search) ||
      owner.slug.toLowerCase().includes(search),
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    resetPage();
  };

  const handleStatusChange = (value: SystemOwnerStatusFilter) => {
    setSelectedStatus(value);
    resetPage();
  };

  return (
    <main className="w-full px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto w-full max-w-[1240px] space-y-4">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-foreground text-xl font-semibold sm:text-2xl">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              {t("description")}
            </p>
          </div>

          <Button
            type="button"
            className="h-10 w-full sm:w-auto"
            onClick={() => setOpenModal({ type: "create" })}
          >
            <Building2 className="size-4" />
            {t("add-new")}
          </Button>
        </section>

        <section className="border-border bg-background flex w-full flex-col gap-3 rounded-2xl border p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:w-1/2">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("search-placeholder")}
              className="h-9 pl-10"
            />
          </div>

          <Select
            value={selectedStatus}
            onValueChange={(value) =>
              handleStatusChange(value as SystemOwnerStatusFilter)
            }
          >
            <SelectTrigger className="w-full lg:w-1/4">
              <SelectValue placeholder={t("filter-status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t("filter-status")}</SelectLabel>
                {systemOwnerStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status-filter.${status}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </section>

        <SystemOwnersTable
          data={paginatedData}
          totalCount={filteredData.length}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isLoading={isPending}
          onEdit={(owner) => setOpenModal({ type: "edit", entity: owner })}
          onDelete={(owner) => setOpenModal({ type: "delete", entity: owner })}
        />

        {openModal?.type === "create" && (
          <CreateSystemOwnerForm
            openForm={openModal.type === "create"}
            setOpenForm={() => setOpenModal(null)}
          />
        )}
        {openModal?.type === "edit" && (
          <EditSystemOwnerForm
            owner={openModal.entity}
            openForm={openModal.type === "edit"}
            setOpenForm={() => setOpenModal(null)}
          />
        )}
        {openModal?.type === "delete" && (
          <DeleteSystemOwnerForm
            owner={openModal.entity}
            openDelete={openModal.type === "delete"}
            setOpenDelete={() => setOpenModal(null)}
          />
        )}
      </div>
    </main>
  );
}
