import maizeImg from "@/assets/waste-maize-cobs.jpg";
import riceImg from "@/assets/waste-rice-husk.jpg";
import bagasseImg from "@/assets/waste-sugarcane-bagasse.jpg";
import coffeeImg from "@/assets/waste-coffee-husks.jpg";
import sunflowerImg from "@/assets/waste-sunflower-stalks.jpg";
import wheatImg from "@/assets/waste-wheat-straw.jpg";

export const wasteImages: Record<string, string> = {
  "Maize Cobs": maizeImg,
  "Rice Husk": riceImg,
  "Sugarcane Bagasse": bagasseImg,
  "Coffee Husks": coffeeImg,
  "Sunflower Stalks": sunflowerImg,
  "Wheat Straw": wheatImg,
};

/** Curated, reliable high-res imagery for custom/other agricultural waste types */
interface WastePreset {
  keywords: string[];
  label: string;
  url: string;
}

export const OTHER_WASTE_PRESETS: WastePreset[] = [
  {
    keywords: ["banana", "ndizi", "pseudostem", "banana stem", "banana peel", "plantain"],
    label: "Banana Stems & Leaves Biomass",
    url: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["sawdust", "wood", "timber", "carpenter", "shavings", "saw dust", "mbao", "bark"],
    label: "Sawdust & Timber Residues",
    url: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["tea", "chai", "kericho", "tea prunings", "tea waste", "tea factory"],
    label: "Tea Prunings & Processing Waste",
    url: "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["pineapple", "nanasi", "pineapple crown", "pineapple peel", "del monte"],
    label: "Pineapple Crowns & Peels",
    url: "https://images.unsplash.com/photo-1597916829826-02e5bb4a54e0?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["mango", "embe", "mango peel", "mango seed", "fruit pulp", "fruit processing"],
    label: "Mango Peels & Fruit Residue",
    url: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["cassava", "mhogo", "cassava peel", "tuber", "cassava stalks", "yuca"],
    label: "Cassava Peels & Stalks",
    url: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["potato", "viazi", "sweet potato", "irish potato", "potato peel", "potato vines"],
    label: "Potato Peels & Field Vines",
    url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["citrus", "orange", "lemon", "chungwa", "lime", "citrus peel"],
    label: "Citrus Peels & Pulp",
    url: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["coconut", "nazi", "coir", "coconut shell", "copra", "coconut husk"],
    label: "Coconut Coir & Shell Husks",
    url: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["avocado", "parachichi", "avocado seed", "avocado peel", "guacamole waste"],
    label: "Avocado Seeds & Processing Waste",
    url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["hay", "grass", "straw", "pasture", "silage", "fodder", "dry grass"],
    label: "Hay & Dry Grass Biomass",
    url: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["manure", "dung", "compost", "biogas", "slurry", "mbolea", "droppings"],
    label: "Organic Farm Manure & Compost",
    url: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["sorghum", "millet", "mtama", "cereal", "grain straw", "barley"],
    label: "Sorghum & Grain Residues",
    url: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["vegetable", "market", "organic", "cabbage", "horticulture", "greens", "sukuma"],
    label: "Market Vegetables & Organic Greens",
    url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["flower", "rose", "horticultural", "naivasha", "cut flowers"],
    label: "Flower Farm Green Residues",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["bean", "beans", "legume", "kunde", "soya", "soybean", "pea"],
    label: "Bean Straw & Legume Pods",
    url: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["cotton", "pamba", "cotton stalks", "ginnery"],
    label: "Cotton Stalks & Gin Trash",
    url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
  },
  {
    keywords: ["macadamia", "cashew", "nutshell", "nut shell", "korosho"],
    label: "Macadamia & Nut Shells",
    url: "https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=800&q=80",
  },
];

/**
 * Dynamically resolves an image and label for ANY waste query or type.
 * Works seamlessly for preset types (Maize Cobs, etc.) AND custom user input.
 */
export function resolveWasteImage(queryOrType: string): {
  url: string;
  label: string;
  isCustom: boolean;
} {
  const trimmed = (queryOrType ?? "").trim();
  if (!trimmed) {
    return {
      url: bagasseImg,
      label: "Agricultural Biomass",
      isCustom: false,
    };
  }

  // Check standard predefined dictionary first
  if (wasteImages[trimmed]) {
    return {
      url: wasteImages[trimmed],
      label: trimmed,
      isCustom: false,
    };
  }

  const lower = trimmed.toLowerCase();

  // Match standard types by substring
  if (lower.includes("maize") || lower.includes("mahindi") || lower.includes("corn")) {
    return { url: maizeImg, label: "Maize Cobs & Stover", isCustom: true };
  }
  if (lower.includes("rice") || lower.includes("mpunga")) {
    return { url: riceImg, label: "Rice Husk & Straw", isCustom: true };
  }
  if (lower.includes("sugarcane") || lower.includes("bagasse") || lower.includes("sugar")) {
    return { url: bagasseImg, label: "Sugarcane Bagasse", isCustom: true };
  }
  if (lower.includes("coffee") || lower.includes("kahawa")) {
    return { url: coffeeImg, label: "Coffee Husks & Pulp", isCustom: true };
  }
  if (lower.includes("sunflower") || lower.includes("alizeti")) {
    return { url: sunflowerImg, label: "Sunflower Stalks", isCustom: true };
  }
  if (lower.includes("wheat") || lower.includes("ngano")) {
    return { url: wheatImg, label: "Wheat Straw", isCustom: true };
  }

  // Match custom presets
  for (const preset of OTHER_WASTE_PRESETS) {
    if (preset.keywords.some((kw) => lower.includes(kw))) {
      return {
        url: preset.url,
        label: preset.label,
        isCustom: true,
      };
    }
  }

  // Smart fallback: general high-quality agricultural biomass image
  return {
    url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    label: `${trimmed} (Agricultural Residue)`,
    isCustom: true,
  };
}

/** Returns the image URL for a named waste type. */
export function wasteImage(type: string): string {
  return resolveWasteImage(type).url;
}

/**
 * Returns the correct image for a listing.
 * - If the listing has a custom image_url (e.g. for "Other" types), use that.
 * - Otherwise resolve dynamically based on the waste type text.
 */
export function listingImage(listing: { waste_type: string; image_url?: string | null }): string {
  if (listing.image_url && listing.image_url.trim().length > 0) {
    return listing.image_url;
  }
  return resolveWasteImage(listing.waste_type).url;
}
