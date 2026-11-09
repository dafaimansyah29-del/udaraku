import type { Pollutant } from "./air-types";

/** Teks penjelasan polutan dalam bahasa sederhana. Semua kadar dalam µg/m³. */
export const POLLUTANT_INFO: Record<
  Pollutant,
  { symbol: string; name: string; unit: string; desc: string }
> = {
  pm2_5: {
    symbol: "PM2.5",
    name: "Partikel Halus",
    unit: "µg/m³",
    desc: "Debu sangat kecil dari asap kendaraan dan pembakaran. Bisa masuk sampai ke paru-paru.",
  },
  pm10: {
    symbol: "PM10",
    name: "Partikel Kasar",
    unit: "µg/m³",
    desc: "Debu dan serbuk yang bisa membuat batuk dan mata perih.",
  },
  no2: {
    symbol: "NO₂",
    name: "Nitrogen Dioksida",
    unit: "µg/m³",
    desc: "Gas dari asap kendaraan. Bisa memicu sesak napas, terutama pada penderita asma.",
  },
  o3: {
    symbol: "O₃",
    name: "Ozon",
    unit: "µg/m³",
    desc: "Gas yang terbentuk saat siang terik. Bisa membuat dada terasa sesak.",
  },
  so2: {
    symbol: "SO₂",
    name: "Sulfur Dioksida",
    unit: "µg/m³",
    desc: "Gas dari pembakaran batu bara dan industri. Bisa membuat tenggorokan perih.",
  },
  co: {
    symbol: "CO",
    name: "Karbon Monoksida",
    unit: "µg/m³",
    desc: "Gas tak berbau dari knalpot dan pembakaran. Mengurangi oksigen dalam darah.",
  },
};
