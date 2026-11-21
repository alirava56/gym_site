import Image from "next/image";
import { cn } from "@/lib/utils";
import { approvedIcons, type ApprovedIconKey } from "@/shared/approved-icons";

const variantClasses = {
  brand: "size-10",
  account: "size-7",
  feature: "size-12 md:size-14",
  program: "size-14 md:size-20",
  plan: "size-16",
  contact: "size-6",
  social: "size-8",
} as const;

export function ApprovedIcon({ icon, variant, className, alt = "", priority = false }: {
  icon: ApprovedIconKey;
  variant: keyof typeof variantClasses;
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return <Image src={approvedIcons[icon]} alt={alt} width={160} height={160} priority={priority} sizes="(max-width: 768px) 80px, 160px" className={cn("object-contain", variantClasses[variant], className)} />;
}
