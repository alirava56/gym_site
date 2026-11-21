import { ApprovedIcon } from "@/components/shared/approved-icon";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <span className="inline-flex items-center gap-2.5"><ApprovedIcon icon="brandLogo" variant="brand" priority />{!compact && <span className="text-lg font-black text-brand-gold">شب قهرمانان</span>}</span>;
}
