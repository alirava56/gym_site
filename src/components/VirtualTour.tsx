import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import NextImage from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  MoveHorizontal,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import manifest from "./gallery-manifest.json";

interface TourDetail {
  id: string;
  title: string;
  description: string;
}

interface TourHotspot extends TourDetail {
  x: number;
  y: number;
}

interface TourScene {
  id: string;
  name: string;
  shortName: string;
  category: string;
  alt: string;
  image: string;
  aspectRatio: number;
  description: string;
  initialPitch: number;
  hotspots: TourHotspot[];
}

interface VirtualTourProps {
  isFullscreen: boolean;
  onFullscreenChange: (isOpen: boolean) => void;
}

interface ViewState {
  yaw: number;
  pitch: number;
  zoom: number;
}

const TOUR_SCENES: TourScene[] = manifest.photos.map((photo) => ({
  id: photo.file,
  name: photo.title,
  shortName: photo.shortTitle,
  category: photo.category,
  alt: photo.alt,
  image: "/assets/web/" + photo.file,
  aspectRatio: photo.width / photo.height,
  description: photo.description ?? "",
  initialPitch: photo.height > photo.width ? 56 : 50,
  hotspots: photo.equipment.map(({ id, name, x, y, description }) => ({
    id,
    x,
    y,
    title: name,
    description,
  })),
}));

const supplementalEquipment: TourDetail = {
  id: "supplemental-equipment",
  title: "تجهیزات تکمیلی باشگاه",
  description: manifest.additionalEquipment.map(({ name }) => name).join("، "),
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const persianNumberFormatter = new Intl.NumberFormat("fa-IR", {
  useGrouping: false,
});

const toPersianNumber = (value: number) =>
  persianNumberFormatter.format(value);

const initialViewFor = (scene: TourScene): ViewState => ({
  yaw: 50,
  pitch: scene.initialPitch,
  zoom: 1,
});

export default function VirtualTour({
  isFullscreen,
  onFullscreenChange,
}: VirtualTourProps) {
  const prefersReducedMotion = useReducedMotion();
  const [sceneIndex, setSceneIndex] = useState(0);
  const [view, setView] = useState<ViewState>(() =>
    initialViewFor(TOUR_SCENES[0]),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoPan, setIsAutoPan] = useState(true);
  const [activeDetail, setActiveDetail] = useState<TourDetail | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [imageStatus, setImageStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [viewerSize, setViewerSize] = useState({ width: 0, height: 0 });

  const viewerRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    startYaw: 50,
    startPitch: 50,
  });
  const autoDirectionRef = useRef(1);

  const scene = TOUR_SCENES[sceneIndex];

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      sessionStorage.setItem("sg_tour_hint_seen", "true");
    } catch {
      // Browsers can block storage in privacy mode; the interaction still works.
    }
  }, []);

  const markManualInteraction = useCallback(() => {
    dismissHint();
    setIsAutoPan(false);
  }, [dismissHint]);

  const resetView = useCallback(() => {
    setView(initialViewFor(scene));
    setActiveDetail(null);
  }, [scene]);

  const selectScene = useCallback((nextIndex: number) => {
    const normalized =
      (nextIndex + TOUR_SCENES.length) % TOUR_SCENES.length;
    const nextScene = TOUR_SCENES[normalized];
    setSceneIndex(normalized);
    setView(initialViewFor(nextScene));
    setActiveDetail(null);
    autoDirectionRef.current = 1;
  }, []);

  useEffect(() => {
    try {
      setShowHint(sessionStorage.getItem("sg_tour_hint_seen") !== "true");
    } catch {
      setShowHint(true);
    }
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) setIsAutoPan(false);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const updateViewerSize = () => {
      const bounds = viewer.getBoundingClientRect();
      setViewerSize({ width: bounds.width, height: bounds.height });
    };

    updateViewerSize();
    const resizeObserver = new ResizeObserver(updateViewerSize);
    resizeObserver.observe(viewer);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    let disposed = false;
    let settled = false;
    const image = new Image();
    setImageStatus("loading");

    const markReady = async () => {
      if (settled) return;
      settled = true;
      try {
        await image.decode?.();
      } catch {
        // A successful load is enough when decode() is unsupported or interrupted.
      }
      if (disposed) return;
      setImageStatus("ready");

      [-1, 1].forEach((direction) => {
        const adjacent =
          TOUR_SCENES[
            (sceneIndex + direction + TOUR_SCENES.length) %
              TOUR_SCENES.length
          ];
        const preloadedImage = new Image();
        preloadedImage.src = adjacent.image;
      });
    };

    image.onload = markReady;
    image.onerror = () => {
      settled = true;
      if (!disposed) setImageStatus("error");
    };
    image.src = scene.image;

    if (image.complete) {
      if (image.naturalWidth > 0) void markReady();
      else setImageStatus("error");
    }

    return () => {
      disposed = true;
    };
  }, [scene.image, sceneIndex, loadAttempt]);

  useEffect(() => {
    if (
      !isAutoPan ||
      isDragging ||
      activeDetail ||
      prefersReducedMotion ||
      imageStatus !== "ready"
    ) {
      return;
    }

    let animationFrame = 0;
    let previousTime = 0;

    const animate = (time: number) => {
      if (previousTime) {
        const deltaSeconds = Math.min((time - previousTime) / 1000, 0.05);
        setView((current) => {
          let nextYaw =
            current.yaw + autoDirectionRef.current * deltaSeconds * 3.4;
          if (nextYaw >= 78) {
            nextYaw = 78;
            autoDirectionRef.current = -1;
          } else if (nextYaw <= 22) {
            nextYaw = 22;
            autoDirectionRef.current = 1;
          }
          return { ...current, yaw: nextYaw };
        });
      }
      previousTime = time;
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [
    activeDetail,
    imageStatus,
    isAutoPan,
    isDragging,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(
      () => closeButtonRef.current?.focus({ preventScroll: true }),
      0,
    );

    return () => {
      window.clearTimeout(focusTimer);
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isFullscreen]);

  const changeZoom = useCallback(
    (amount: number) => {
      markManualInteraction();
      setView((current) => ({
        ...current,
        zoom: clamp(current.zoom + amount, 1, 1.55),
      }));
    },
    [markManualInteraction],
  );

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleWheelZoom = (event: globalThis.WheelEvent) => {
      const zoomDelta = event.deltaY > 0 ? -0.08 : 0.08;
      const nextZoom = clamp(view.zoom + zoomDelta, 1, 1.55);
      if (nextZoom === view.zoom) return;

      event.preventDefault();
      changeZoom(zoomDelta);
    };

    viewer.addEventListener("wheel", handleWheelZoom, { passive: false });
    return () => viewer.removeEventListener("wheel", handleWheelZoom);
  }, [changeZoom, view.zoom]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startYaw: view.yaw,
      startPitch: view.pitch,
    };
    setIsDragging(true);
    markManualInteraction();
    viewerRef.current?.focus({ preventScroll: true });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragRef.current.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontalDelta =
      ((event.clientX - dragRef.current.startX) / bounds.width) * 88;
    const verticalDelta =
      ((event.clientY - dragRef.current.startY) / bounds.height) * 68;

    setView((current) => ({
      ...current,
      yaw: clamp(dragRef.current.startYaw - horizontalDelta, 0, 100),
      pitch: clamp(dragRef.current.startPitch - verticalDelta, 8, 92),
    }));
  };

  const finishPointerInteraction = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current.pointerId = -1;
    setIsDragging(false);
  };

  const handleViewerKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;

    const step = event.shiftKey ? 9 : 4;
    let handled = true;

    switch (event.key) {
      case "ArrowLeft":
        setView((current) => ({
          ...current,
          yaw: clamp(current.yaw - step, 0, 100),
        }));
        break;
      case "ArrowRight":
        setView((current) => ({
          ...current,
          yaw: clamp(current.yaw + step, 0, 100),
        }));
        break;
      case "ArrowUp":
        setView((current) => ({
          ...current,
          pitch: clamp(current.pitch - step, 8, 92),
        }));
        break;
      case "ArrowDown":
        setView((current) => ({
          ...current,
          pitch: clamp(current.pitch + step, 8, 92),
        }));
        break;
      case "+":
      case "=":
        changeZoom(0.08);
        break;
      case "-":
      case "_":
        changeZoom(-0.08);
        break;
      case "Home":
        resetView();
        break;
      case " ":
        if (prefersReducedMotion) {
          handled = false;
        } else {
          setIsAutoPan((current) => !current);
          dismissHint();
        }
        break;
      case "Escape":
        if (activeDetail) setActiveDetail(null);
        else if (isFullscreen) onFullscreenChange(false);
        handled = false;
        event.stopPropagation();
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
      if (event.key !== " " && event.key !== "Home") markManualInteraction();
    }
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isFullscreen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      if (activeDetail) setActiveDetail(null);
      else onFullscreenChange(false);
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) => (element as HTMLElement).offsetParent !== null,
    ) as HTMLElement[];
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const baseBackgroundHeight = viewerSize.width
    ? Math.max(
        viewerSize.height * 1.08,
        (viewerSize.width * 1.16) / scene.aspectRatio,
      )
    : 0;
  const backgroundHeight = baseBackgroundHeight * view.zoom;
  const backgroundWidth = backgroundHeight * scene.aspectRatio;
  const backgroundSize = viewerSize.width
    ? `${backgroundWidth}px ${backgroundHeight}px`
    : "cover";

  const controlButtonClass =
    "flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/45 text-white/75 backdrop-blur-md transition hover:border-[#d4af37]/45 hover:bg-black/65 hover:text-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]";

  const sceneViewer = (
    <div
      ref={viewerRef}
      tabIndex={0}
      role="group"
      aria-roledescription="نمای تعاملی پانوراما"
      aria-label={`نمای تعاملی ${scene.name}. برای حرکت از درگ یا کلیدهای جهت‌دار و برای زوم از کلیدهای مثبت و منفی استفاده کنید.`}
      className={`relative h-full w-full overflow-hidden bg-[#0b0d0f] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d4af37] ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{ touchAction: isFullscreen ? "none" : "pan-y" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerInteraction}
      onPointerCancel={finishPointerInteraction}
      onKeyDown={handleViewerKeyDown}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={scene.id}
          role="img"
          aria-label={scene.alt}
          initial={prefersReducedMotion ? false : { opacity: 0.25 }}
          animate={{ opacity: 1 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="absolute inset-0 will-change-[background-position]"
          style={{
            backgroundImage: `url("${scene.image}")`,
            backgroundPosition: `${view.yaw}% ${view.pitch}%`,
            backgroundRepeat: "no-repeat",
            backgroundSize,
          }}
        />
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,8,0.68)_0%,transparent_26%,transparent_60%,rgba(5,7,8,0.82)_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/35 to-transparent md:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/35 to-transparent md:w-32" />
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" />

      <div className="pointer-events-none absolute right-3 top-3 max-w-[calc(100%-7.5rem)] text-right sm:right-5 sm:top-5 sm:max-w-md">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[9px] font-black tracking-[0.15em] text-[#d4af37] backdrop-blur-md sm:text-[10px]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          {scene.category}
        </div>
        <h3 className="mt-2 text-base font-black text-white drop-shadow-lg sm:text-xl">
          {scene.name}
        </h3>
        <p className="mt-1 hidden max-w-sm text-[11px] leading-6 text-white/70 drop-shadow md:block">
          {scene.description}
        </p>
      </div>

      <div
        className="absolute left-3 top-3 z-30 flex items-center gap-1.5 sm:left-5 sm:top-5"
        dir="ltr"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onFullscreenChange(!isFullscreen)}
          className={controlButtonClass}
          aria-label={isFullscreen ? "خروج از حالت تمام‌صفحه" : "نمایش تمام‌صفحه"}
          title={isFullscreen ? "خروج از تمام‌صفحه" : "تمام‌صفحه"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          disabled={Boolean(prefersReducedMotion)}
          onClick={() => {
            dismissHint();
            setIsAutoPan((current) => !current);
          }}
          aria-pressed={isAutoPan && !prefersReducedMotion}
          className={`${controlButtonClass} disabled:cursor-not-allowed disabled:opacity-35`}
          aria-label={
            prefersReducedMotion
              ? "حرکت خودکار در تنظیمات دستگاه غیرفعال است"
              : isAutoPan
                ? "توقف حرکت خودکار"
                : "شروع حرکت خودکار"
          }
          title={
            prefersReducedMotion
              ? "حرکت خودکار غیرفعال است"
              : isAutoPan
                ? "توقف حرکت خودکار"
                : "حرکت خودکار"
          }
        >
          {isAutoPan && !prefersReducedMotion ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={resetView}
          className={`${controlButtonClass} hidden sm:flex`}
          aria-label="بازنشانی زاویه دید"
          title="بازنشانی زاویه"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <div className="hidden items-center overflow-hidden rounded-xl border border-white/10 bg-black/45 backdrop-blur-md sm:flex">
          <button
            type="button"
            onClick={() => changeZoom(-0.08)}
            disabled={view.zoom <= 1}
            className="flex h-10 w-9 items-center justify-center text-white/70 transition hover:text-[#d4af37] disabled:opacity-30"
            aria-label="کوچک‌نمایی"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-10 text-center text-[9px] font-bold text-white/55">
            {toPersianNumber(Math.round(view.zoom * 100))}٪
          </span>
          <button
            type="button"
            onClick={() => changeZoom(0.08)}
            disabled={view.zoom >= 1.55}
            className="flex h-10 w-9 items-center justify-center text-white/70 transition hover:text-[#d4af37] disabled:opacity-30"
            aria-label="بزرگ‌نمایی"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute left-1/2 top-4 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[9px] font-bold text-white/60 backdrop-blur-md lg:flex">
        <Compass
          className={`h-3.5 w-3.5 text-[#d4af37] ${
            isAutoPan ? "animate-pulse motion-reduce:animate-none" : ""
          }`}
        />
        <span>زاویه دید {toPersianNumber(Math.round(view.yaw * 3.6))}°</span>
      </div>

      {scene.hotspots.map((hotspot, index) => {
        const rawLeft = viewerSize.width
          ? (((viewerSize.width - backgroundWidth) * (view.yaw / 100) +
              backgroundWidth * (hotspot.x / 100)) /
              viewerSize.width) *
            100
          : hotspot.x;
        const rawTop = viewerSize.height
          ? (((viewerSize.height - backgroundHeight) * (view.pitch / 100) +
              backgroundHeight * (hotspot.y / 100)) /
              viewerSize.height) *
            100
          : hotspot.y;
        const isVisible = imageStatus === "ready" &&
          rawLeft >= 3 && rawLeft <= 97 && rawTop >= 12 && rawTop <= 88;
        const isActive = activeDetail?.id === hotspot.id;

        return (
          <motion.button
            key={hotspot.id}
            type="button"
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.7 }}
            animate={{
              opacity: isVisible ? 1 : 0,
              scale: 1,
            }}
            transition={{ delay: prefersReducedMotion ? 0 : index * 0.08 }}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => {
              dismissHint();
              setIsAutoPan(false);
              setActiveDetail(isActive ? null : hotspot);
            }}
            aria-label={`نمایش اطلاعات: ${hotspot.title}`}
            aria-expanded={isActive}
            aria-hidden={!isVisible}
            tabIndex={isVisible ? 0 : -1}
            className={`group absolute z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              isActive
                ? "border-white bg-[#d4af37] text-black shadow-[0_0_0_7px_rgba(212,175,55,0.18)]"
                : "border-[#d4af37] bg-black/65 text-[#d4af37] shadow-[0_0_24px_rgba(212,175,55,0.28)] hover:scale-110 hover:bg-black/80"
            }`}
            style={{
              left: `${rawLeft}%`,
              top: `${rawTop}%`,
              pointerEvents: isVisible ? "auto" : "none",
            }}
          >
            {!isActive && (
              <span className="absolute inset-0 -z-10 animate-ping rounded-full border border-[#d4af37]/50 motion-reduce:animate-none" />
            )}
            <span className="text-xs font-black">
              {toPersianNumber(index + 1)}
            </span>
            <span className="pointer-events-none absolute bottom-13 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-[10px] font-bold text-white opacity-0 shadow-xl backdrop-blur-md transition group-hover:opacity-100 group-focus-visible:opacity-100 md:block">
              {hotspot.title}
            </span>
          </motion.button>
        );
      })}

      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => selectScene(sceneIndex + 1)}
        className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 backdrop-blur-md transition hover:border-[#d4af37]/50 hover:text-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] sm:left-5"
        aria-label="فضای بعدی"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => selectScene(sceneIndex - 1)}
        className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/75 backdrop-blur-md transition hover:border-[#d4af37]/50 hover:text-[#d4af37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] sm:right-5"
        aria-label="فضای قبلی"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {showHint && !activeDetail && imageStatus === "ready" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d4af37]/25 bg-black/60 px-4 py-2 text-[10px] font-bold text-white/75 shadow-2xl backdrop-blur-md sm:text-[11px]">
              <MoveHorizontal className="h-4 w-4 text-[#d4af37]" />
              <span>برای دیدن اطراف، تصویر را بکشید</span>
              <span className="hidden text-white/35 sm:inline">• اسکرول برای زوم</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeDetail && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            role="status"
            aria-live="polite"
            className="absolute bottom-4 left-4 right-4 z-40 rounded-2xl border border-[#d4af37]/30 bg-[#111416]/92 p-4 text-right shadow-[0_22px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:left-auto sm:w-[360px] sm:p-5"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveDetail(null)}
              className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
              aria-label="بستن توضیحات"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3 pl-9">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/12 text-[#d4af37]">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[9px] font-black tracking-widest text-[#d4af37]">
                  {activeDetail.id === supplementalEquipment.id ? "فهرست باشگاه" : "نقطه تعاملی"}
                </span>
                <h4 className="mt-0.5 text-sm font-black text-white">
                  {activeDetail.title}
                </h4>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-6 text-white/70 sm:text-xs">
              {activeDetail.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {imageStatus === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0d0f]/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-7 py-5 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#d4af37] motion-reduce:animate-none" />
              <div>
                <p className="text-xs font-bold text-white">در حال آماده‌سازی تصویر</p>
                <p className="mt-1 text-[10px] text-white/45">{scene.name}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {imageStatus === "error" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0d0f] p-6 text-center">
          <div className="max-w-xs">
            <Info className="mx-auto h-7 w-7 text-[#d4af37]" />
            <h4 className="mt-3 text-sm font-black text-white">
              تصویر این فضا بارگذاری نشد
            </h4>
            <p className="mt-2 text-[11px] leading-6 text-white/55">
              اتصال یا فایل تصویر را بررسی کنید و دوباره تلاش کنید.
            </p>
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setLoadAttempt((current) => current + 1)}
              className="mt-4 rounded-xl bg-[#d4af37] px-5 py-2.5 text-xs font-black text-black transition hover:bg-[#e2c04e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              تلاش دوباره
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const sceneRail = (
    <div className="shrink-0 border-t border-white/[0.07] bg-[#111416] px-3 py-3 sm:px-4">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <div className="hidden min-w-32 text-right lg:block">
          <div className="text-[9px] font-black tracking-widest text-[#d4af37]">
            انتخاب فضا
          </div>
          <div className="mt-1 text-[10px] text-white/45">
            {toPersianNumber(sceneIndex + 1)} از{" "}
            {toPersianNumber(TOUR_SCENES.length)}
          </div>
        </div>
        <div className="flex flex-1 gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TOUR_SCENES.map((item, index) => {
            const isCurrent = index === sceneIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectScene(index)}
                aria-current={isCurrent ? "true" : undefined}
                className={`group relative h-16 min-w-[118px] flex-1 overflow-hidden rounded-xl border text-right transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] sm:h-[72px] sm:min-w-[150px] ${
                  isCurrent
                    ? "border-[#d4af37] shadow-[0_0_0_1px_rgba(212,175,55,0.24)]"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <NextImage
                  src={item.image}
                  alt=""
                  fill
                  sizes="(max-width: 639px) 118px, (max-width: 1023px) 150px, 220px"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span
                  className={`absolute inset-0 ${
                    isCurrent
                      ? "bg-gradient-to-t from-black/90 via-black/20 to-transparent"
                      : "bg-black/55 transition group-hover:bg-black/35"
                  }`}
                />
                <span className="absolute bottom-2 right-2 left-2 flex items-end justify-between gap-2">
                  <span className="truncate text-[10px] font-black text-white sm:text-[11px]">
                    {item.shortName}
                  </span>
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-black ${
                      isCurrent
                        ? "bg-[#d4af37] text-black"
                        : "bg-black/55 text-white/65"
                    }`}
                  >
                    {toPersianNumber(index + 1)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <section
      className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-16 md:px-8 md:py-20"
      aria-labelledby="tour-title"
    >
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl text-right">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1.5 text-[10px] font-black text-[#d4af37]">
            <Sparkles className="h-3.5 w-3.5" />
            بازدید تعاملی از فضای واقعی باشگاه
          </div>
          <h2
            id="tour-title"
            className="text-2xl font-black leading-tight text-white md:text-3xl"
          >
            قبل از حضورتان، داخل باشگاه قدم بزنید
          </h2>
          <p className="mt-3 max-w-2xl text-xs leading-7 text-white/58 md:text-sm">
            تصویر را با ماوس یا انگشت حرکت دهید، زاویه دید را تغییر دهید و نقاط
            طلایی هر سالن را لمس کنید تا جزئیات تجهیزات را ببینید.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-bold text-white/55">
            {toPersianNumber(TOUR_SCENES.length)} فضای واقعی
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[10px] font-bold text-white/55">
            {toPersianNumber(
              TOUR_SCENES.reduce(
                (total, tourScene) => total + tourScene.hotspots.length,
                0,
              ),
            )}{" "}
            نقطه تعاملی
          </span>
          <button
            type="button"
            onClick={() => onFullscreenChange(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2.5 text-xs font-black text-black shadow-lg shadow-[#d4af37]/10 transition hover:-translate-y-0.5 hover:bg-[#e0bd48] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Maximize2 className="h-4 w-4" />
            تجربه تمام‌صفحه
          </button>
        </div>
      </div>

      <div
        ref={dialogRef}
        role={isFullscreen ? "dialog" : undefined}
        aria-modal={isFullscreen || undefined}
        aria-label={isFullscreen ? "تور مجازی باشگاه شب قهرمانان" : undefined}
        onKeyDown={handleDialogKeyDown}
        className={
          isFullscreen
            ? "fixed inset-0 z-[120] flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#090b0c]"
            : "relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111416] shadow-[0_28px_90px_rgba(0,0,0,0.42)]"
        }
        dir="rtl"
      >
        {isFullscreen && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#111416] px-3 py-3 sm:px-5">
            <div className="min-w-0 text-right">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 shrink-0 text-[#d4af37]" />
                <h3 className="truncate text-xs font-black text-white sm:text-sm">
                  تور مجازی شب قهرمانان
                </h3>
              </div>
              <p className="mt-1 hidden truncate text-[10px] text-white/45 sm:block">
                {scene.name} • حرکت با لمس، ماوس یا کلیدهای جهت‌دار
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="تجهیزات تکمیلی باشگاه"
                aria-expanded={activeDetail?.id === supplementalEquipment.id}
                title="تجهیزات تکمیلی باشگاه"
                className={controlButtonClass}
                onClick={() => {
                  markManualInteraction();
                  setActiveDetail((current) =>
                    current?.id === supplementalEquipment.id ? null : supplementalEquipment,
                  );
                }}
              >
                <Info aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => onFullscreenChange(false)}
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] sm:px-4"
                aria-label="بستن تور و بازگشت به سایت"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">بازگشت به سایت</span>
              </button>
            </div>
          </div>
        )}

        <div
          className={
            isFullscreen
              ? "relative min-h-0 flex-1"
              : "relative h-[64svh] min-h-[440px] max-h-[560px] md:h-[620px] md:max-h-[620px]"
          }
        >
          {sceneViewer}
        </div>
        {sceneRail}
      </div>
    </section>
  );
}
