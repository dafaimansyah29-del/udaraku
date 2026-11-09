import { describe, expect, it } from "vitest";
import { ARTICLES, getVideoId } from "./education";

describe("ARTICLES", () => {
  it("ada 4 artikel dengan id unik, isi, dan 3 poin penting", () => {
    expect(ARTICLES).toHaveLength(4);
    expect(new Set(ARTICLES.map((a) => a.id)).size).toBe(4);
    for (const a of ARTICLES) {
      expect(a.body.length).toBeGreaterThanOrEqual(3);
      expect(a.points).toHaveLength(3);
    }
  });
  it("judulnya sesuai permintaan", () => {
    expect(ARTICLES.map((a) => a.title)).toEqual([
      "Apa itu PM2.5?",
      "Cara memilih masker",
      "Tips udara dalam ruangan",
      "Kelompok rentan",
    ]);
  });
});

describe("getVideoId", () => {
  it("menerima ID YouTube 11 karakter", () => {
    expect(getVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getVideoId("  dQw4w9WgXcQ ")).toBe("dQw4w9WgXcQ");
  });
  it("menolak kosong atau bentuk lain (mencegah injeksi ke URL embed)", () => {
    expect(getVideoId("")).toBeNull();
    expect(getVideoId(undefined)).toBeNull();
    expect(getVideoId("pendek")).toBeNull();
    expect(getVideoId("dQw4w9WgXcQ?x=1&y")).toBeNull();
    expect(getVideoId("https://youtu.be/dQw4w9WgXcQ")).toBeNull();
  });
});