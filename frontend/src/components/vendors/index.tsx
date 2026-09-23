"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Building2, Search } from "lucide-react";

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
import CreateVendorForm from "@/components/vendors/create-vendor-form";
import DeleteVendorForm from "@/components/vendors/delete-vendor-form";
import EditVendorForm from "@/components/vendors/edit-vendor-form";
import VendorsTable from "@/components/vendors/table";
import { useFilters } from "@/hooks/use-filters";
import { useGetVendors } from "@/hooks/vendors/get-all";
import type { ModalState } from "@/types/modal";
import type { Vendor, VendorStatusFilter } from "@/types/vendor";
import { vendorStatusOptions } from "@/types/vendor";

export default function Vendors() {
  const t = useTranslations("vendors");
  const [openModal, setOpenModal] = useState<ModalState<Vendor>>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState<VendorStatusFilter>("all");

  const { data: vendors, isPending } = useGetVendors({
    page: 1,
    pageSize: 100,
  });

  const filters = useMemo(
    () => [
      (vendor: Vendor) =>
        selectedStatus === "all" || vendor.status === selectedStatus,
    ],
    [selectedStatus],
  );

  const {
    currentPage,
    filteredData,
    paginatedData,
    setCurrentPage,
    resetPage,
  } = useFilters<Vendor>({
    data: vendors,
    pageSize: 5,
    filters,
    searchValue,
    searchFn: (vendor, search) =>
      vendor.name.toLowerCase().includes(search) ||
      vendor.slug.toLowerCase().includes(search),
  });

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    resetPage();
  };

  const handleStatusChange = (value: VendorStatusFilter) => {
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
              handleStatusChange(value as VendorStatusFilter)
            }
          >
            <SelectTrigger className="w-full lg:w-1/4">
              <SelectValue placeholder={t("filter-status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t("filter-status")}</SelectLabel>
                {vendorStatusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`status-filter.${status}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </section>

        <VendorsTable
          data={paginatedData}
          totalCount={filteredData.length}
          pageSize={5}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isLoading={isPending}
          onEdit={(vendor) => setOpenModal({ type: "edit", entity: vendor })}
          onDelete={(vendor) =>
            setOpenModal({ type: "delete", entity: vendor })
          }
        />

        {openModal?.type === "create" && (
          <CreateVendorForm
            openForm={openModal.type === "create"}
            setOpenForm={() => setOpenModal(null)}
          />
        )}
        {openModal?.type === "edit" && (
          <EditVendorForm
            vendor={openModal.entity}
            openForm={openModal.type === "edit"}
            setOpenForm={() => setOpenModal(null)}
          />
        )}
        {openModal?.type === "delete" && (
          <DeleteVendorForm
            vendor={openModal.entity}
            openDelete={openModal.type === "delete"}
            setOpenDelete={() => setOpenModal(null)}
          />
        )}
      </div>
    </main>
  );
}
