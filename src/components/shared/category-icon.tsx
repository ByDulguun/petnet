import {
  Accessibility,
  Armchair,
  BedDouble,
  Building2,
  CalendarCheck,
  CalendarPlus,
  Camera,
  Car,
  Check,
  CircleParking,
  Coffee,
  CreditCard,
  DoorOpen,
  Flame,
  Footprints,
  GraduationCap,
  Heart,
  HeartHandshake,
  Home,
  Hotel,
  House,
  PawPrint,
  Pill,
  QrCode,
  School,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Siren,
  Stethoscope,
  Sun,
  Trees,
  Truck,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Icon registry for data-driven taxonomy rows (BusinessCategory.icon /
 * Amenity.icon store lucide names). Unknown names fall back to a paw print,
 * so adding new categories in the database needs no code change.
 */
const ICONS: Record<string, LucideIcon> = {
  accessibility: Accessibility,
  armchair: Armchair,
  "bed-double": BedDouble,
  "building-2": Building2,
  "calendar-check": CalendarCheck,
  "calendar-plus": CalendarPlus,
  camera: Camera,
  car: Car,
  check: Check,
  "circle-parking": CircleParking,
  coffee: Coffee,
  "credit-card": CreditCard,
  "door-open": DoorOpen,
  flame: Flame,
  footprints: Footprints,
  "graduation-cap": GraduationCap,
  heart: Heart,
  "heart-handshake": HeartHandshake,
  home: Home,
  hotel: Hotel,
  house: House,
  "paw-print": PawPrint,
  pill: Pill,
  "qr-code": QrCode,
  school: School,
  scissors: Scissors,
  "shield-check": ShieldCheck,
  "shopping-bag": ShoppingBag,
  siren: Siren,
  stethoscope: Stethoscope,
  sun: Sun,
  trees: Trees,
  truck: Truck,
  waves: Waves,
  wifi: Wifi,
};

export function iconByName(name: string): LucideIcon {
  return ICONS[name] ?? PawPrint;
}

/** Design-system tone key → soft tile classes. */
const TONES: Record<string, string> = {
  brand: "bg-brand-soft text-brand",
  blue: "bg-brand-blue-soft text-brand-blue",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
};

export function toneClasses(tone: string): string {
  return TONES[tone] ?? TONES.brand;
}

export function CategoryIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = iconByName(icon);
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}
