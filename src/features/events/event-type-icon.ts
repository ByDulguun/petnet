import {
  CalendarDays,
  GraduationCap,
  Heart,
  Syringe,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export const EVENT_TYPE_ICON: Record<string, LucideIcon> = {
  MEETUP: Users,
  DOG_SHOW: Trophy,
  TRAINING_CAMP: GraduationCap,
  VACCINATION_DAY: Syringe,
  ADOPTION_DAY: Heart,
  OTHER: CalendarDays,
};
