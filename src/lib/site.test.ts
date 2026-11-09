import { describe, expect, it } from "vitest";
import { SITE_ROUTES, parseOwner, resolveSiteUrl } from "./site";

describe("resolveSiteUrl", () => {
  it("memakai NEXT_PUBLIC_SITE_URL lebih dulu dan membuang path/garis miring akhir", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://udaraku.id/", VERCEL_URL: "x.vercel.app" })).toBe("https://udaraku.id");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://udaraku.id/abc?x=1" })).toBe("https://udaraku.id");
  });

  it("lalu domain produksi Vercel, lalu alamat deployment", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "udaraku.vercel.app", VERCEL_URL: "udaraku-abc.vercel.app" })).toBe(
      "https://udaraku.vercel.app",
    );
    expect(resolveSiteUrl({ VERCEL_URL: "udaraku-abc.vercel.app" })).toBe("https://udaraku-abc.vercel.app");
  });

  it("bawaan localhost, dan mengabaikan nilai tidak sah atau protokol berbahaya", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "bukan url" })).toBe("http://localhost:3000");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)", VERCEL_URL: "a.vercel.app" })).toBe("https://a.vercel.app");
  });
});

describe("parseOwner", () => {
  it("kosong bila tidak diisi, tidak mengarang nama", () => {
    expect(parseOwner({})).toEqual({ name: "", email: "" });
  });

  it("menerima nama dan email yang sah", () => {
    expect(parseOwner({ NEXT_PUBLIC_OWNER_NAME: " Tim UdaraKu ", NEXT_PUBLIC_CONTACT_EMAIL: "halo@udaraku.id" })).toEqual({
      name: "Tim UdaraKu",
      email: "halo@udaraku.id",
    });
  });

  it("menolak email yang tidak sah atau berisi markup, dan memotong nama panjang", () => {
    expect(parseOwner({ NEXT_PUBLIC_CONTACT_EMAIL: "bukan email" }).email).toBe("");
    expect(parseOwner({ NEXT_PUBLIC_CONTACT_EMAIL: 'a@b.c"><script>' }).email).toBe("");
    expect(parseOwner({ NEXT_PUBLIC_OWNER_NAME: "x".repeat(300) }).name).toHaveLength(100);
  });
});

describe("SITE_ROUTES", () => {
  it("memuat semua halaman termasuk /tentang, tanpa duplikat", () => {
    const paths = SITE_ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of ["/", "/cek-udara", "/kalkulator-risiko", "/prakiraan", "/peta", "/edukasi", "/tentang"]) {
      expect(paths).toContain(p);
    }
  });
});