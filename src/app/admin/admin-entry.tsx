"use client";
import { useEffect } from "react"; import { useExperience } from "@/components/experience/experience-provider";
export function AdminEntry(){const{openAdmin}=useExperience();useEffect(()=>openAdmin(),[openAdmin]);return <main className="grid min-h-screen place-items-center bg-brand-bg text-brand-muted">در حال بارگذاری پنل مدیریت…</main>}
