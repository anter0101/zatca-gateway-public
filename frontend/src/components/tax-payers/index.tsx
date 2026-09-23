"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, UserPlus } from "lucide-react";

import CreateTaxPayerForm from "@/components/tax-payers/create-tax-payer-form";
import DeleteTaxPayerForm from "@/components/tax-payers/delete-tax-payer-form";
import EditTaxPayerForm from "@/components/tax-payers/edit-tax-payer-form";
import TaxPayersTable from "@/components/tax-payers/table";
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
import { useGetTaxPayers } from "@/hooks/tax-payers/get-all";
import { useFilters } from "@/hooks/use-filters";
import { useGetVendors } from "@/hooks/vendors/get-all";
import type { ModalState } from "@/types/modal";
import type { TaxPayer, TaxPayerStatusFilter } from "@/types/tax-payer";
import { taxPayerStatusOptions } from "@/types/tax-payer";

export default function TaxPayers() {
  const t = useTranslations("tax-payers");
  const { data: vendors = [], isPending: isVendorsPending } = useGetVendors({
    page: 1,
    pageSize: 100,
  });
  const [selectedVendorId, setSelectedVendorId] = useState<
    number | undefined
  >();
  const [openModal, setOpenModal] = useState<ModalState<TaxPayer>>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<TaxPayerStatusFilter>("all");

  const hasVendor = typeof selectedVendorId === "number";

  const { data: payers = [], isPending } = useGetTaxPayers({
    vendorId: selectedVendorId ?? 0,
    page: 1,
    pageSize: 100,
    enabled: hasVendor,
  });

  const filters = useMemo(
    () => [
      (payer: TaxPayer) =>
        selectedStatus === "all" || payer.status === selectedStatus,
    ],
    [selectedStatus],
  );

  const {
    currentPage,
    filteredData,
    paginatedData,
    setCurrentPage,
    resetPage,
  } = useFilters<TaxPayer>({
    data: hasVendor ? payers : [],
    pageSize: 5,
    filters,
    searchValue,
    searchFn: (payer, search) =>
      payer.legalName.toLowerCase().includes(search) ||
      payer.vatNumber.toLowerCase().includes(search) ||
      payer.organizationUnitName.toLowerCase().includes(search),
  });

  const handleVendorChange = (value: string) => {
    setSelectedVendorId(Number(value));
    setSearchValue("");
    setSelectedStatus("all");
    setOpenModal(null);
    resetPage();
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    resetPage();
  };

  const handleStatusChange = (value: TaxPayerStatusFilter) => {
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
            disabled={!hasVendor}
            onClick={() => setOpenModal({ type: "create" })}
          >
            <UserPlus className="size-4" />
            {t("add-new")}
          </Button>
        </section>

        <section className="border-border bg-background flex w-full flex-col gap-3 rounded-2xl border p-3 sm:p-4">
          <Select
            value={
              selectedVendorId !== undefined
                ? String(selectedVendorId)
                : undefined
            }
            onValueChange={handleVendorChange}
            disabled={isVendorsPending}
          >
            <SelectTrigger className="w-full lg:w-1/3">
              <SelectValue placeholder={t("select-vendor")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t("select-vendor")}</SelectLabel>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={String(vendor.id)}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-1/2">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("search-placeholder")}
                className="h-9 pl-10"
                disabled={!hasVendor}
              />
            </div>

            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                handleStatusChange(value as TaxPayerStatusFilter)
              }
              disabled={!hasVendor}
            >
              <SelectTrigger className="w-full lg:w-1/4">
                <SelectValue placeholder={t("filter-status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("filter-status")}</SelectLabel>
                  {taxPayerStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`status-filter.${status}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </section>

        <TaxPayersTable
          data={hasVendor ? paginatedData : []}
          totalCount={hasVendor ? filteredData.length : 0}
          pageSize={5}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isLoading={hasVendor && isPending}
          emptyMessage={
            hasVendor ? t("table.empty") : t("table.select-vendor-first")
          }
          onEdit={(payer) => setOpenModal({ type: "edit", entity: payer })}
          onDelete={(payer) => setOpenModal({ type: "delete", entity: payer })}
        />

        {hasVendor && openModal?.type === "create" && (
          <CreateTaxPayerForm
            vendorId={selectedVendorId}
            openForm={openModal.type === "create"}
            setOpenForm={() => setOpenModal(null)}
          />
        )}
        {openModal?.type === "edit" && (
          <EditTaxPayerForm
            payer={openModal.entity}
            openForm={openModal.type === "edit"}
            setOpenForm={() => setOpenModal(null)}
          />
        )}
        {openModal?.type === "delete" && (
          <DeleteTaxPayerForm
            payer={openModal.entity}
            openDelete={openModal.type === "delete"}
            setOpenDelete={() => setOpenModal(null)}
          />
        )}
      </div>
    </main>
  );
}
