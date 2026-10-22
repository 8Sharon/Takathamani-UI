import maizeImg from "@/assets/waste-maize-cobs.jpg";
import riceImg from "@/assets/waste-rice-husk.jpg";
import bagasseImg from "@/assets/waste-sugarcane-bagasse.jpg";

export const wasteImages: Record<string, string> = {
  "Maize Cobs": maizeImg,
  "Rice Husk": riceImg,
  "Sugarcane Bagasse": bagasseImg,
  "Coffee Husks": riceImg,
  "Sunflower Stalks": bagasseImg,
  "Wheat Straw": bagasseImg,
};

export function wasteImage(type: string): string {
  return wasteImages[type] ?? bagasseImg;
}
