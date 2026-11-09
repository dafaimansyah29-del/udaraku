"use client";

import {
  ACTIVITIES,
  ACTIVITY_ORDER,
  CONDITIONS,
  CONDITION_ORDER,
  INPUT_LIMITS,
  MASKS,
  MASK_ORDER,
} from "@/lib/risk-config";
import type { Activity, Condition, Mask } from "@/lib/risk-config";
import { normalizeConditions } from "@/lib/risk";
import type { FormErrors, FormValues } from "@/lib/risk";
import { IconCheck } from "@/components/ui/Icons";

type Props = {
  form: FormValues;
  errors: FormErrors;
  onChange: (patch: Partial<FormValues>) => void;
};

const DURATION_SHORTCUTS = [15, 30, 60, 120];

const inputClass =
  "h-12 w-full rounded-2xl bg-white/10 px-4 text-base text-white ring-1 ring-white/25 transition placeholder:text-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-400";

/** Kartu pilihan: radio atau checkbox asli (bisa dipakai keyboard dan pembaca layar). */
function Option({
  type,
  name,
  checked,
  onChange,
  label,
  hint,
  className = "",
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  hint: string;
  className?: string;
}) {
  return (
    <label className={`relative block cursor-pointer ${className}`}>
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="flex h-full min-h-[64px] items-center gap-3 rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/15 transition hover:bg-white/[0.1] hover:ring-white/35 peer-checked:bg-cyan/10 peer-checked:ring-2 peer-checked:ring-cyan peer-focus-visible:ring-[3px] peer-focus-visible:ring-white">
        <span
          aria-hidden="true"
          className={`grid h-5 w-5 shrink-0 place-items-center border-2 transition ${
            type === "radio" ? "rounded-full" : "rounded-md"
          } ${checked ? "border-cyan bg-cyan text-ink" : "border-white/45 bg-transparent"}`}
        >
          {checked && <IconCheck className="h-3 w-3" strokeWidth={3} />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold leading-tight text-white">
            {label}
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-white/75">
            {hint}
          </span>
        </span>
      </span>
    </label>
  );
}

function Group({
  title,
  subtitle,
  step,
  children,
}: {
  title: string;
  subtitle: string;
  step: number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full flex-col gap-5 rounded-3xl bg-white/[0.07] p-5 ring-1 ring-white/10 sm:p-6">
      <header className="flex items-center gap-3 border-b border-white/10 pb-4">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-biru to-ungu text-sm font-bold text-white shadow-glow"
        >
          {step}
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-base font-extrabold leading-tight text-white sm:text-lg">
            {title}
          </h3>
          <p className="text-xs text-white/75 sm:text-sm">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

/** Kolom isian dengan satuan di dalam kolom (mis. "tahun", "menit"). */
function Unit({ children, unit }: { children: React.ReactNode; unit: string }) {
  return (
    <div className="relative">
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm font-semibold text-white/75"
      >
        {unit}
      </span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2.5 last:border-b-0">
      <dt className="text-sm text-white/75">{label}</dt>
      <dd className="text-right text-sm font-bold text-white">{value}</dd>
    </div>
  );
}

export default function ProfileForm({ form, errors, onChange }: Props) {
  const toggleCondition = (c: Condition) => {
    let next: Condition[];
    if (c === "none") {
      next = ["none"];
    } else if (form.conditions.includes(c)) {
      next = form.conditions.filter((x) => x !== c);
    } else {
      next = [...form.conditions.filter((x) => x !== "none"), c];
    }
    onChange({ conditions: normalizeConditions(next) });
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      noValidate
      aria-label="Profil kesehatan dan rencana aktivitas"
      className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3"
    >
      <Group
        step={1}
        title="Tentang kamu"
        subtitle="Usia dan kondisi kesehatanmu"
      >
        <div>
          <label
            htmlFor="usia"
            className="mb-1.5 block text-sm font-semibold text-white"
          >
            Usia<span className="sr-only"> (tahun)</span>
          </label>
          <Unit unit="tahun">
            <input
              id="usia"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={form.age}
              onChange={(e) =>
                onChange({ age: e.target.value.replace(/\D/g, "").slice(0, 3) })
              }
              aria-invalid={errors.age ? true : undefined}
              aria-describedby={errors.age ? "usia-galat" : undefined}
              className={`${inputClass} pr-16`}
            />
          </Unit>
          {errors.age && (
            <p
              id="usia-galat"
              role="alert"
              className="mt-1.5 text-sm font-medium text-red-300"
            >
              {errors.age}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-white">
            Kondisi kesehatan{" "}
            <span className="font-normal text-white/75">
              (boleh pilih lebih dari satu)
            </span>
          </legend>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
            {CONDITION_ORDER.map((c) => (
              <Option
                key={c}
                className={c === "none" ? "sm:col-span-2 xl:col-span-1" : ""}
                type="checkbox"
                name="kondisi"
                checked={form.conditions.includes(c)}
                onChange={() => toggleCondition(c)}
                label={CONDITIONS[c].label}
                hint={CONDITIONS[c].hint}
              />
            ))}
          </div>
        </fieldset>
      </Group>

      <Group
        step={2}
        title="Rencana aktivitas"
        subtitle="Jenis dan lama kamu di luar rumah"
      >
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold text-white">
            Jenis aktivitas
          </legend>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
            {ACTIVITY_ORDER.map((a: Activity) => (
              <Option
                key={a}
                type="radio"
                name="aktivitas"
                checked={form.activity === a}
                onChange={() => onChange({ activity: a })}
                label={ACTIVITIES[a].label}
                hint={ACTIVITIES[a].hint}
              />
            ))}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="durasi"
            className="mb-1.5 block text-sm font-semibold text-white"
          >
            Durasi<span className="sr-only"> (menit)</span>
          </label>
          <div className="space-y-2.5">
            <Unit unit="menit">
              <input
                id="durasi"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={form.duration}
                onChange={(e) =>
                  onChange({
                    duration: e.target.value.replace(/\D/g, "").slice(0, 3),
                  })
                }
                aria-invalid={errors.duration ? true : undefined}
                aria-describedby={
                  errors.duration ? "durasi-galat" : "durasi-bantuan"
                }
                className={`${inputClass} pr-20`}
              />
            </Unit>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_SHORTCUTS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={form.duration === String(m)}
                  onClick={() => onChange({ duration: String(m) })}
                  className={`h-10 rounded-full text-sm font-semibold transition ${
                    form.duration === String(m)
                      ? "bg-cyan text-ink"
                      : "bg-white/10 text-white ring-1 ring-white/25 hover:bg-white/20"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          {errors.duration ? (
            <p
              id="durasi-galat"
              role="alert"
              className="mt-1.5 text-sm font-medium text-red-300"
            >
              {errors.duration}
            </p>
          ) : (
            <p id="durasi-bantuan" className="mt-1.5 text-xs text-white/75">
              Boleh {INPUT_LIMITS.duration.min} sampai{" "}
              {INPUT_LIMITS.duration.max} menit.
            </p>
          )}
        </div>
      </Group>

      <div className="flex flex-col gap-5 lg:col-span-2 xl:col-span-1">
        <Group
          step={3}
          title="Perlindungan"
          subtitle="Seberapa terlindungi kamu saat di luar"
        >
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-white">
              Masker yang kamu pakai
            </legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {MASK_ORDER.map((m: Mask) => (
                <Option
                  key={m}
                  type="radio"
                  name="masker"
                  checked={form.mask === m}
                  onChange={() => onChange({ mask: m })}
                  label={MASKS[m].label}
                  hint={MASKS[m].hint}
                />
              ))}
            </div>
          </fieldset>
        </Group>

        <section
          aria-labelledby="ringkasan-judul"
          className="flex-1 rounded-3xl bg-gradient-to-br from-[#0B1E5B]/80 to-[#16278A]/60 p-5 ring-1 ring-cyan/30 sm:p-6"
        >
          <h3
            id="ringkasan-judul"
            className="font-heading text-base font-extrabold text-white sm:text-lg"
          >
            Ringkasan pilihanmu
          </h3>
          <dl className="mt-2">
            <SummaryRow
              label="Usia"
              value={form.age ? `${form.age} tahun` : "-"}
            />
            <SummaryRow
              label="Kondisi"
              value={
                form.conditions.length === 0
                  ? "-"
                  : form.conditions.map((c) => CONDITIONS[c].label).join(", ")
              }
            />
            <SummaryRow
              label="Aktivitas"
              value={ACTIVITIES[form.activity].label}
            />
            <SummaryRow
              label="Durasi"
              value={form.duration ? `${form.duration} menit` : "-"}
            />
            <SummaryRow label="Masker" value={MASKS[form.mask].label} />
          </dl>
        </section>
      </div>
    </form>
  );
}