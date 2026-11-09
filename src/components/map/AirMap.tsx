"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { FirePoint } from "@/lib/firms";
import { formatNumber } from "@/lib/format";

/** Pusat awal: Indonesia. */
const DEFAULT_CENTER: [number, number] = [-2.5, 118];
const DEFAULT_ZOOM = 5;

export type AirPin = {
  lat: number;
  lon: number;
  name: string;
  /** PM2.5 dalam µg/m³, null bila tidak tersedia. */
  pm25: number | null;
  /** Warna dan teks kategori udara; abu-abu bila datanya contoh. */
  color: string;
  ink: string;
  category: string;
  /** Teks waktu update yang sudah diformat, atau null. */
  updated: string | null;
  isMock: boolean;
};

export type MapBounds = { west: number; south: number; east: number; north: number; zoom: number };

type Props = {
  pin: AirPin | null;
  fires: FirePoint[];
  showFires: boolean;
  reduceMotion: boolean;
  onBoundsChange: (bounds: MapBounds) => void;
};

/** Pindahkan peta ke penanda baru. */
function FlyToPin({ pin, reduceMotion }: { pin: AirPin | null; reduceMotion: boolean }) {
  const map = useMap();
  const lat = pin?.lat;
  const lon = pin?.lon;
  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    if (reduceMotion) map.setView([lat, lon], 10, { animate: false });
    else map.flyTo([lat, lon], 10, { duration: 1.2 });
  }, [map, lat, lon, reduceMotion]);
  return null;
}

/** Laporkan area yang terlihat, dipakai untuk mengambil titik panas. */
function BoundsWatcher({ onChange }: { onChange: Props["onBoundsChange"] }) {
  const map = useMapEvents({
    moveend: () => report(),
    zoomend: () => report(),
  });
  function report() {
    const b = map.getBounds();
    onChange({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth(), zoom: map.getZoom() });
  }
  useEffect(() => {
    report();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const CONFIDENCE_LABEL = { rendah: "Rendah", normal: "Normal", tinggi: "Tinggi" } as const;

function formatFireTime(iso: string): string {
  try {
    return `${new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(iso))} WIB`;
  } catch {
    return iso;
  }
}

export default function AirMap({ pin, fires, showFires, reduceMotion, onBoundsChange }: Props) {
  const markerRef = useRef<L.Marker | null>(null);

  // Ikon bulat berwarna kategori, berisi angka PM2.5. Warna berasal dari konstanta
  // kategori di lib/aqi.ts, bukan dari masukan pengguna.
  const icon = useMemo(() => {
    if (!pin) return null;
    const text = pin.pm25 === null ? "–" : String(Math.round(pin.pm25));
    return L.divIcon({
      className: "udaraku-pin",
      html: `<i class="pin-pulse" style="--pin:${pin.color}"></i><span class="pin-core" style="--pin:${pin.color};background:${pin.color};color:${pin.ink}">${text}</span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24],
    });
  }, [pin]);

  // Buka popup otomatis saat lokasi berganti (bukan saat hanya warna/nilai berubah,
  // misalnya setelah pengguna menukar standar indeks).
  const pinLat = pin?.lat;
  const pinLon = pin?.lon;
  useEffect(() => {
    if (pinLat === undefined || pinLon === undefined) return;
    const t = window.setTimeout(() => markerRef.current?.openPopup(), reduceMotion ? 50 : 1300);
    return () => window.clearTimeout(t);
  }, [pinLat, pinLon, reduceMotion]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={3}
      scrollWheelZoom
      className="h-full w-full"
    >
      {/* Peta dasar OpenStreetMap (tanpa API key). Warnanya diubah jadi gelap navy lewat
          filter CSS di globals.css (kelas .leaflet-tile-pane), jadi tampilannya khas UdaraKu. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <BoundsWatcher onChange={onBoundsChange} />
      <FlyToPin pin={pin} reduceMotion={reduceMotion} />

      {showFires &&
        fires.map((f, i) => (
          <CircleMarker
            key={`${f.lat},${f.lon},${f.time},${i}`}
            center={[f.lat, f.lon]}
            radius={Math.min(12, 4 + Math.sqrt(Math.max(0, f.frp ?? 0)))}
            pathOptions={{ color: "#FDBA74", weight: 1, fillColor: "#F97316", fillOpacity: 0.8 }}
          >
            <Popup>
              <p className="font-heading text-sm font-extrabold">Titik panas</p>
              <p className="mt-1 text-xs text-white/80">Terdeteksi satelit {formatFireTime(f.time)}</p>
              <p className="text-xs text-white/80">
                Kekuatan: {f.frp === null ? "tidak diketahui" : `${formatNumber(f.frp, 1)} MW`}
              </p>
              <p className="text-xs text-white/80">
                Keyakinan: {f.confidence ? CONFIDENCE_LABEL[f.confidence] : "tidak diketahui"}
              </p>
            </Popup>
          </CircleMarker>
        ))}

      {pin && icon && (
        <Marker
          ref={markerRef}
          position={[pin.lat, pin.lon]}
          icon={icon}
          title={`${pin.name}: ${pin.category}`}
          zIndexOffset={1000}
        >
          <Popup>
            <p className="font-heading text-sm font-extrabold">{pin.name}</p>
            {pin.isMock ? (
              <p className="mt-1 max-w-[220px] text-xs text-white/80">
                Data udara asli belum bisa diambil, jadi nilai PM2.5 tidak ditampilkan.
              </p>
            ) : (
              <>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/80">PM2.5</p>
                <p className="font-heading text-2xl font-extrabold leading-none">
                  {pin.pm25 === null ? "Tidak tersedia" : formatNumber(pin.pm25, 1)}
                  {pin.pm25 !== null && <span className="ml-1 text-xs font-semibold text-white/80">µg/m³</span>}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs font-bold">
                  <span
                    aria-hidden="true"
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: pin.color }}
                  />
                  {pin.category}
                </p>
                {pin.updated && <p className="mt-1 text-[11px] text-white/75">Diperbarui {pin.updated}</p>}
              </>
            )}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}