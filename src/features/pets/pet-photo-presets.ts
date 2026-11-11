// Curated preset photos pets can choose from — real image "selection"
// without needing an upload pipeline (Cloudinary isn't configured yet).
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=400&q=80`;

export const PET_PHOTO_PRESETS: { id: string; url: string; alt: string }[] = [
  { id: "dog-1", url: u("photo-1552053831-71594a27632d"), alt: "Golden retriever" },
  { id: "dog-2", url: u("photo-1583511655857-d19b40a7a54e"), alt: "Happy dog portrait" },
  { id: "dog-3", url: u("photo-1560807707-8cc77767d783"), alt: "Dog outdoors" },
  { id: "dog-4", url: u("photo-1601758228041-f3b2795255f1"), alt: "Puppy" },
  { id: "cat-1", url: u("photo-1543466835-00a7907e9de1"), alt: "Cat portrait" },
  { id: "cat-2", url: u("photo-1514888286974-6c03e2ca1dba"), alt: "Cat close-up" },
  { id: "cat-3", url: u("photo-1529778873920-4da4926a72c2"), alt: "Kitten" },
  { id: "other-1", url: u("photo-1425082661705-1834bfd09dca"), alt: "Small pet" },
];
