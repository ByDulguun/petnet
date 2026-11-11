// Reference taxonomy — fixture rows for BusinessCategory and Amenity.
// These are DATA, not code: the UI resolves icons by name with a fallback,
// so adding a category/amenity here (or via the DB once provisioned)
// requires no component changes.

import type { AmenityRef, CategoryRef } from "@/lib/types";

export interface CategoryRow extends CategoryRef {
  nameMn: string;
  description: string;
  sortOrder: number;
}

export const CATEGORIES: CategoryRow[] = [
  { slug: "veterinary-clinic", name: "Veterinary Clinic", nameMn: "Малын эмнэлэг", icon: "stethoscope", tone: "blue", description: "Checkups, vaccinations, surgery and diagnostics", sortOrder: 1 },
  { slug: "emergency-vet", name: "24h Emergency Vet", nameMn: "Яаралтай тусламж", icon: "siren", tone: "danger", description: "Round-the-clock emergency and critical care", sortOrder: 2 },
  { slug: "pet-shop", name: "Pet Shop", nameMn: "Амьтны дэлгүүр", icon: "shopping-bag", tone: "brand", description: "Food, toys, accessories and supplies", sortOrder: 3 },
  { slug: "pet-pharmacy", name: "Pet Pharmacy", nameMn: "Малын эмийн сан", icon: "pill", tone: "success", description: "Medication, supplements and prescriptions", sortOrder: 4 },
  { slug: "grooming-salon", name: "Grooming Salon", nameMn: "Гоо сайхан", icon: "scissors", tone: "danger", description: "Baths, cuts, nails and spa care", sortOrder: 5 },
  { slug: "pet-hotel", name: "Pet Hotel", nameMn: "Амьтны буудал", icon: "hotel", tone: "warning", description: "Overnight boarding with care and play", sortOrder: 6 },
  { slug: "daycare", name: "Daycare", nameMn: "Өдрийн асрамж", icon: "sun", tone: "warning", description: "Daytime care, play groups and socialization", sortOrder: 7 },
  { slug: "dog-trainer", name: "Dog Trainer", nameMn: "Сургагч", icon: "graduation-cap", tone: "success", description: "Obedience, behavior and private lessons", sortOrder: 8 },
  { slug: "dog-school", name: "Dog School", nameMn: "Нохойн сургууль", icon: "school", tone: "success", description: "Group classes and structured programs", sortOrder: 9 },
  { slug: "dog-walker", name: "Dog Walker", nameMn: "Зайлуулагч", icon: "footprints", tone: "blue", description: "Daily walks and exercise services", sortOrder: 10 },
  { slug: "pet-taxi", name: "Pet Taxi", nameMn: "Амьтны такси", icon: "car", tone: "warning", description: "Safe transport for pets across the city", sortOrder: 11 },
  { slug: "pet-photographer", name: "Pet Photographer", nameMn: "Гэрэл зурагчин", icon: "camera", tone: "blue", description: "Studio and outdoor pet photo sessions", sortOrder: 12 },
  { slug: "breeder", name: "Breeder", nameMn: "Үржүүлэгч", icon: "paw-print", tone: "brand", description: "Registered, health-tested breeders", sortOrder: 13 },
  { slug: "shelter", name: "Shelter", nameMn: "Хоргодох байр", icon: "heart", tone: "danger", description: "Rescue shelters caring for homeless pets", sortOrder: 14 },
  { slug: "adoption-center", name: "Adoption Center", nameMn: "Үрчлэлтийн төв", icon: "heart-handshake", tone: "danger", description: "Meet and adopt pets looking for homes", sortOrder: 15 },
  { slug: "dog-park", name: "Dog Park", nameMn: "Нохойн парк", icon: "trees", tone: "success", description: "Off-leash play areas and agility zones", sortOrder: 16 },
  { slug: "pet-friendly-cafe", name: "Pet-Friendly Cafe", nameMn: "Кафе", icon: "coffee", tone: "warning", description: "Cafes that welcome pets inside", sortOrder: 17 },
  { slug: "pet-friendly-hotel", name: "Pet-Friendly Hotel", nameMn: "Зочид буудал", icon: "bed-double", tone: "blue", description: "Hotels where your pet stays with you", sortOrder: 18 },
  { slug: "pet-friendly-apartment", name: "Pet-Friendly Housing", nameMn: "Орон сууц", icon: "building-2", tone: "blue", description: "Apartments and residences that allow pets", sortOrder: 19 },
  { slug: "pet-swimming-pool", name: "Pet Swimming Pool", nameMn: "Усан сан", icon: "waves", tone: "blue", description: "Swim sessions and hydrotherapy", sortOrder: 20 },
  { slug: "pet-boarding", name: "Pet Boarding", nameMn: "Асралт", icon: "home", tone: "warning", description: "Long-stay boarding in home settings", sortOrder: 21 },
  { slug: "pet-sitting", name: "Pet Sitting", nameMn: "Асрагч", icon: "armchair", tone: "warning", description: "In-home pet sitting while you're away", sortOrder: 22 },
  { slug: "pet-cremation", name: "Pet Cremation", nameMn: "Чандарлах", icon: "flame", tone: "brand", description: "Dignified farewell and memorial services", sortOrder: 23 },
  { slug: "pet-insurance", name: "Pet Insurance", nameMn: "Даатгал", icon: "shield-check", tone: "success", description: "Health coverage plans for your pet", sortOrder: 24 },
];

export const AMENITIES: AmenityRef[] = [
  { slug: "parking", name: "Parking", icon: "circle-parking" },
  { slug: "wheelchair", name: "Wheelchair accessible", icon: "accessibility" },
  { slug: "emergency", name: "Emergency service", icon: "siren" },
  { slug: "appointment-required", name: "Appointment required", icon: "calendar-check" },
  { slug: "walk-ins", name: "Walk-ins welcome", icon: "door-open" },
  { slug: "home-visit", name: "Home visits", icon: "house" },
  { slug: "accepts-card", name: "Accepts card", icon: "credit-card" },
  { slug: "accepts-qpay", name: "Accepts QPay", icon: "qr-code" },
  { slug: "delivery", name: "Delivery", icon: "truck" },
  { slug: "pet-friendly", name: "Pets inside welcome", icon: "paw-print" },
  { slug: "wifi", name: "Free Wi-Fi", icon: "wifi" },
  { slug: "online-booking", name: "Online booking", icon: "calendar-plus" },
];

export const DISTRICTS = [
  "Sükhbaatar",
  "Chingeltei",
  "Bayangol",
  "Bayanzürkh",
  "Khan-Uul",
  "Songino Khairkhan",
  "Nalaikh",
] as const;

export function getCategory(slug: string): CategoryRow | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getAmenity(slug: string): AmenityRef | undefined {
  return AMENITIES.find((a) => a.slug === slug);
}
