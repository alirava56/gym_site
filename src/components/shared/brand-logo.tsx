import Image from "next/image";

const brandAssets = {
  emblem: {
    src: "/assets/brand/navbar-emblem.webp",
    width: 320,
    height: 180,
  },
  wordmark: {
    src: "/assets/brand/navbar-wordmark-possessive.webp",
    width: 480,
    height: 184,
  },
} as const;

function BrandWordmark({ className, sizes, priority = false }: { className: string; sizes: string; priority?: boolean }) {
  return (
    <Image
      src={brandAssets.wordmark.src}
      alt=""
      width={brandAssets.wordmark.width}
      height={brandAssets.wordmark.height}
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}

export function NavbarBrandLogo() {
  return (
    <span aria-hidden="true" className="inline-flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 leading-none lg:w-24">
      <Image
        src={brandAssets.emblem.src}
        alt=""
        width={brandAssets.emblem.width}
        height={brandAssets.emblem.height}
        priority
        sizes="(min-width: 1024px) 48px, 44px"
        className="h-auto w-11 lg:w-12"
      />
      <BrandWordmark
        priority
        sizes="(min-width: 1024px) 96px, 80px"
        className="h-auto w-20 lg:w-24"
      />
    </span>
  );
}

export function FooterBrandLogo() {
  return (
    <span role="img" aria-label="شب قهرمانان" className="inline-flex max-w-full">
      <BrandWordmark
        sizes="(min-width: 768px) 160px, 144px"
        className="h-auto w-36 max-w-full md:w-40"
      />
    </span>
  );
}
