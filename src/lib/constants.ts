/**
 * Konstanta aplikasi untuk konfigurasi global, timeout, dan magic numbers.
 */

/** API endpoints dan konfigurasi */
export const API = {
  AIR_ENDPOINT: "/api/air",
  OPEN_METEO_AIR_URL: process.env.OPEN_METEO_AIR_URL ?? "https://air-quality-api.open-meteo.com/v1/air-quality",
  OPEN_METEO_WEATHER_URL: process.env.OPEN_METEO_WEATHER_URL ?? "https://api.open-meteo.com/v1/forecast",
  OPEN_METEO_GEOCODING_URL: "https://geocoding-api.open-meteo.com/v1/search",
  CACHE_REVALIDATE_SECONDS: 15 * 60,
  TIMEOUT_MS: 8000,
  GEOCODING_TIMEOUT_MS: 8000,
} as const;

/** Geolocation options */
export const GEOLOCATION = {
  ENABLE_HIGH_ACCURACY: false,
  TIMEOUT_MS: 10000,
  MAXIMUM_AGE_MS: 5 * 60 * 1000,
} as const;

/** Search dan debounce timing */
export const SEARCH = {
  DEBOUNCE_MS: 350,
  MIN_QUERY_LENGTH: 2,
  GEOCODING_RESULT_COUNT: 6,
} as const;

/** Coordinate rounding untuk cache optimization */
export const COORDINATES = {
  DECIMAL_PLACES: 2,
  MIN_LAT: -90,
  MAX_LAT: 90,
  MIN_LON: -180,
  MAX_LON: 180,
} as const;

/** Intersection Observer margins untuk scroll detection */
export const SCROLL_OBSERVER = {
  ROOT_MARGIN: "-40% 0px -55% 0px",
  SCROLL_THRESHOLD: 40,
} as const;

/** Animation timing */
export const ANIMATION = {
  FADE_UP_DURATION: 0.7,
  FADE_UP_EASING: "easeOut",
  GAUGE_DURATION: 1.3,
  GAUGE_EASING: [0.22, 1, 0.36, 1],
  CARD_STAGGER_DELAY: 0.12,
  CARD_DURATION: 0.6,
  POLLUTANT_CARD_DELAY: 0.08,
  POLLUTANT_CARD_DURATION: 0.45,
  POLLUTANT_BAR_DELAY_OFFSET: 0.1,
  POLLUTANT_BAR_DURATION: 0.8,
  SPRING_STIFFNESS: 380,
  SPRING_DAMPING: 32,
} as const;

/** Scroll smoothing behavior */
export const SCROLL = {
  SMOOTH_BEHAVIOR: "smooth" as const,
  BLOCK_START: "start" as const,
} as const;

/** Polutan configuration */
export const POLLUTANTS = {
  KEYS: ["pm2_5", "pm10", "no2", "o3", "so2", "co"] as const,
} as const;

/** AQI Scale defaults */
export const AQI_SCALE = {
  MAX_US: 300,
  MAX_ISPU: 300,
  DEFAULT_VALUE: 0,
  MAX_VALUE: 500,
} as const;

/** Error messages */
export const ERROR_MESSAGES = {
  INVALID_COORDINATES: "Koordinat tidak valid.",
  GEOLOCATION_DENIED: "Izin lokasi ditolak. Kamu bisa mencari nama kotamu di kolom pencarian.",
  GEOLOCATION_UNAVAILABLE: "Lokasimu belum bisa ditemukan. Coba cari nama kotamu di kolom pencarian.",
  GEOLOCATION_TIMEOUT: "Mencari lokasi terlalu lama. Coba lagi, atau cari nama kotamu.",
  BROWSER_NO_GEOLOCATION: "Peramban ini tidak mendukung deteksi lokasi. Cari nama kotamu di kolom pencarian.",
  NETWORK_ERROR: "Sepertinya ada gangguan sebentar. Periksa koneksi internetmu, lalu coba lagi.",
} as const;

/** Feature flags untuk konten/experiment */
export const FEATURES = {
  SHOW_MOCK_WARNING: true,
  SHOW_DATA_SOURCES: true,
} as const;
