import type { ComponentType, SVGProps } from "react";
import { ArchiveBoxIcon, Bars3Icon, DocumentTextIcon, FolderIcon, HomeIcon, LinkIcon, LightBulbIcon, MicrophoneIcon, PaperClipIcon, PlusIcon, MagnifyingGlassIcon, Cog6ToothIcon, XMarkIcon, ArrowRightIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
export type IconName = "home"|"vault"|"insights"|"settings"|"note"|"url"|"file"|"audio"|"search"|"plus"|"menu"|"close"|"arrow"|"reset";
const icons: Record<IconName, ComponentType<SVGProps<SVGSVGElement>>> = { home:HomeIcon, vault:ArchiveBoxIcon, insights:LightBulbIcon, settings:Cog6ToothIcon, note:DocumentTextIcon, url:LinkIcon, file:PaperClipIcon, audio:MicrophoneIcon, search:MagnifyingGlassIcon, plus:PlusIcon, menu:Bars3Icon, close:XMarkIcon, arrow:ArrowRightIcon, reset:ArrowPathIcon };
export function Icon({ name, className = "" }: { name: IconName; className?: string }) { const Component = icons[name]; return <Component aria-hidden="true" className={className} strokeWidth={1.8} />; }
export const itemIcon: Record<string, IconName> = { note:"note", url:"url", file:"file", audio:"audio" };
