"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Nav from "@/components/Nav";
import PageTransition from "@/components/PageTransition";
import { createClient } from "@/lib/supabase/client";
import { inviteDesigner } from "@/app/actions/invite";
import { linkDesignerAccount } from "@/app/actions/link-designer";
import GlassButton from "@/components/GlassButton";
import Avatar from "@/components/Avatar";
import { setAuthRole } from "@/app/actions/role";

const greetings = ["Hi", "Hello", "Moi", "Tere", "Hallo", "Merhaba", "Ahoj", "Xin chào", "Hei"];
const years = [2026, 2025, 2024, 2023];

// ─── DB types ─────────────────────────────────────────────────────────────────

interface DbDesigner {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  location: string | null;
  joined_at: string;
  is_active: boolean;
  left_at: string | null;
  avatar_url: string | null;
  auth_user_id: string | null;
}

async function uploadImage(bucket: string, path: string, file: File): Promise<string> {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function deleteStorageFiles(bucket: string, namePrefix: string) {
  const supabase = createClient();
  const { data } = await supabase.storage.from(bucket).list("", { search: namePrefix });
  const toDelete = data?.filter((f) => f.name.startsWith(`${namePrefix}.`)).map((f) => f.name);
  if (toDelete?.length) await supabase.storage.from(bucket).remove(toDelete);
}

interface DbEntry {
  id: string;
  title: string | null;
  figma_url: string | null;
  thumbnail_url: string | null;
  designer_id: string;
  designer: { id: string; slug: string; name: string; avatar_url?: string | null } | null;
}

interface DbChallenge {
  id: string;
  challenge_date: string;
  prompt: string | null;
  status: string;
  master_of_ceremony: { slug: string; name: string } | null;
  entries: DbEntry[];
}

interface DbSeason {
  id: string;
  number: number;
  starts_at: string;
}

type ActiveModal =
  | { kind: "new-challenge" }
  | { kind: "edit-challenge"; challenge: DbChallenge }
  | { kind: "submit-entry"; challenge: DbChallenge }
  | { kind: "edit-entry"; challenge: DbChallenge; entry: DbEntry }
  | { kind: "set-prompt"; challenge: DbChallenge }
  | { kind: "new-designer" }
  | { kind: "edit-designer"; designer: DbDesigner }
  | null;

// ─── Shared primitives ────────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const inputBase = "w-full h-10 px-3 text-sm text-fg-primary bg-canvas rounded-lg outline-none placeholder:text-fg-muted";
const inputStyle = { boxShadow: "none", transition: "box-shadow 150ms ease-out" };

function onHoverIn(e: React.MouseEvent<HTMLElement>) {
  if (document.activeElement !== e.currentTarget)
    (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 0 0 1px var(--color-line)";
}
function onHoverOut(e: React.MouseEvent<HTMLElement>) {
  if (document.activeElement !== e.currentTarget)
    (e.currentTarget as HTMLElement).style.boxShadow = "none";
}
function onFocusIn(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.boxShadow = "inset 0 0 0 1px var(--color-accent)";
}
function onFocusOut(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.boxShadow = "none";
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, style, ...rest } = props;
  return (
    <input
      {...rest}
      className={`${inputBase} ${className ?? ""}`}
      style={{ ...inputStyle, ...style }}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, style, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${inputBase} py-3 resize-none ${className ?? ""}`}
      style={{ ...inputStyle, height: undefined, ...style }}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
      onFocus={onFocusIn}
      onBlur={onFocusOut}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, style, children, onChange, value, ...rest } = props;
  return (
    <div className={`relative ${className ?? "w-full"}`}>
      <select
        {...rest}
        value={value}
        className={`${inputBase} appearance-none pr-9 w-full`}
        style={{ ...inputStyle, color: value ? "var(--color-fg-primary)" : "var(--color-fg-muted)", ...style }}
        onChange={onChange}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
        onFocus={onFocusIn}
        onBlur={onFocusOut}
      >
        {children}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-fg-muted">
        <ChevronDown />
      </span>
    </div>
  );
}


const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => currentYear - i);
const CHALLENGE_YEARS = Array.from({ length: 10 }, (_, i) => currentYear + 1 - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function selectColor(val: string) {
  return val ? "var(--color-fg-primary)" : "var(--color-fg-muted)";
}

function DatePicker({ value, onChange }: { value: { day: string; month: string; year: string }; onChange: (v: { day: string; month: string; year: string }) => void }) {
  return (
    <div className="flex gap-2">
      <Select value={value.day} onChange={(e) => onChange({ ...value, day: e.target.value })} style={{ color: selectColor(value.day) }} className="flex-1">
        <option value="">Day</option>
        {DAYS.map((d) => <option key={d} value={String(d)}>{d}</option>)}
      </Select>
      <Select value={value.month} onChange={(e) => onChange({ ...value, month: e.target.value })} style={{ color: selectColor(value.month) }} className="flex-1">
        <option value="">Month</option>
        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
      </Select>
      <Select value={value.year} onChange={(e) => onChange({ ...value, year: e.target.value })} style={{ color: selectColor(value.year) }} className="flex-1">
        <option value="">Year</option>
        {CHALLENGE_YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
      </Select>
    </div>
  );
}

function MonthYearPicker({ value, onChange }: { value: { month: string; year: string }; onChange: (v: { month: string; year: string }) => void }) {
  return (
    <div className="flex gap-2">
      <Select value={value.month} onChange={(e) => onChange({ ...value, month: e.target.value })} style={{ color: selectColor(value.month) }} className="flex-1">
        <option value="">Month</option>
        {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
      </Select>
      <Select value={value.year} onChange={(e) => onChange({ ...value, year: e.target.value })} style={{ color: selectColor(value.year) }} className="flex-1">
        <option value="">Year</option>
        {YEARS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
      </Select>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-sm text-fg-muted">{label}</p>
      {children}
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-canvas/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
        <div className="flex min-h-full items-center justify-center p-6 pointer-events-none">
          <motion.div
            className="w-full max-w-[400px] bg-surface rounded-2xl p-5 flex flex-col gap-4 pointer-events-auto"
            style={{ boxShadow: "var(--shadow-modal)" }}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-base text-fg-secondary flex-1 min-w-0">{title}</p>
              <GlassButton onClick={onClose} className="w-10 h-10 shrink-0">
                <CloseIcon />
              </GlassButton>
            </div>
            {children}
          </motion.div>
        </div>
      </div>
    </>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function NewChallengeModal({ designers, seasons, onClose, onSaved }: {
  designers: DbDesigner[];
  seasons: DbSeason[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [date, setDate] = useState({ day: "", month: "", year: "" });
  const [moc, setMoc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!date.day || !date.month || !date.year) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const dateStr = `${date.year}-${String(MONTHS.indexOf(date.month) + 1).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
    const year = parseInt(date.year);
    const season = seasons.find((s) => new Date(s.starts_at).getFullYear() === year)
      ?? seasons.find((s) => new Date(s.starts_at).getFullYear() <= year);
    if (!season) { setError("No matching season found for that year"); setSaving(false); return; }
    const mocDesigner = moc ? designers.find((d) => d.id === moc) : null;
    const { error: err } = await supabase.from("challenges").insert({
      challenge_date: dateStr,
      prompt: "",
      status: "open",
      season_id: season.id,
      master_of_ceremony_id: mocDesigner?.id ?? null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  return (
    <ModalShell title="New challenge" onClose={onClose}>
      <FieldGroup label="Date">
        <DatePicker value={date} onChange={setDate} />
      </FieldGroup>
      <FieldGroup label="Master of Ceremony">
        <Select value={moc} onChange={(e) => setMoc(e.target.value)} style={{ color: moc ? "var(--color-fg-primary)" : "var(--color-fg-muted)" }}>
          <option value="">Select designer</option>
          {designers.filter((d) => d.is_active).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </FieldGroup>
      {error && <p className="text-xs text-danger">{error}</p>}
      <GlassButton className="px-4 py-2.5 text-sm w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </GlassButton>
    </ModalShell>
  );
}

const POSITION_POINTS: Record<number, number> = { 1: 10, 2: 6, 3: 4 };

function EditChallengeModal({ challenge, designers, onClose, onSaved }: {
  challenge: DbChallenge;
  designers: DbDesigner[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [prompt, setPrompt] = useState(challenge.prompt ?? "");
  const [status, setStatus] = useState(challenge.status ?? "open");
  const [date, setDate] = useState(() => {
    const d = new Date(challenge.challenge_date);
    return { day: String(d.getUTCDate()), month: MONTHS[d.getUTCMonth()], year: String(d.getUTCFullYear()) };
  });
  const [moc, setMoc] = useState(challenge.master_of_ceremony ? designers.find((d) => d.slug === challenge.master_of_ceremony?.slug)?.id ?? "" : "");
  const [placements, setPlacements] = useState<Record<1 | 2 | 3, string>>({ 1: "", 2: "", 3: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing results on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.from("results").select("position, entry_id").eq("challenge_id", challenge.id).then(({ data }) => {
      if (!data) return;
      const next = { 1: "", 2: "", 3: "" } as Record<1 | 2 | 3, string>;
      data.forEach((r) => {
        if (r.position === 1 || r.position === 2 || r.position === 3)
          next[r.position as 1 | 2 | 3] = r.entry_id ?? "";
      });
      setPlacements(next);
    });
  }, [challenge.id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    // Update challenge
    const { error: err } = await supabase
      .from("challenges")
      .update({ prompt, status, challenge_date: `${date.year}-${String(MONTHS.indexOf(date.month) + 1).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`, master_of_ceremony_id: moc || null })
      .eq("id", challenge.id);
    if (err) { setError(err.message); setSaving(false); return; }

    // Replace results for positions 1–3
    await supabase.from("results").delete().eq("challenge_id", challenge.id).in("position", [1, 2, 3]);
    const toInsert = ([1, 2, 3] as const)
      .filter((pos) => placements[pos])
      .map((pos) => ({ challenge_id: challenge.id, entry_id: placements[pos], position: pos, points_awarded: POSITION_POINTS[pos] }));
    if (toInsert.length > 0) {
      const { error: rErr } = await supabase.from("results").insert(toInsert);
      if (rErr) { setError(rErr.message); setSaving(false); return; }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!confirm("Delete this challenge? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("challenges").delete().eq("id", challenge.id);
    onSaved();
    onClose();
  }

  const entryOptions = challenge.entries;
  const challengeYear = new Date(challenge.challenge_date).getFullYear();
  const hasPodium = challengeYear !== 2025;
  const positions = hasPodium ? ([1, 2, 3] as const) : ([1] as const);
  const posLabel: Record<number, string> = { 1: "Winner", 2: "2nd place", 3: "3rd place" };

  return (
    <ModalShell title="Edit challenge" onClose={onClose}>
      <FieldGroup label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Active</option>
          <option value="closed">Closed</option>
        </Select>
      </FieldGroup>
      <FieldGroup label="Date">
        <DatePicker value={date} onChange={setDate} />
      </FieldGroup>
      <FieldGroup label="Prompt">
        <Textarea style={{ height: 120 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </FieldGroup>
      <FieldGroup label="Master of Ceremony">
        <Select value={moc} onChange={(e) => setMoc(e.target.value)}>
          <option value="">Select designer</option>
          {designers.filter((d) => d.is_active).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select>
      </FieldGroup>
      {positions.map((pos) => (
        <FieldGroup key={pos} label={posLabel[pos]}>
          <Select value={placements[pos]} onChange={(e) => setPlacements((p) => ({ ...p, [pos]: e.target.value }))}>
            <option value="">—</option>
            {entryOptions.map((e) => (
              <option key={e.id} value={e.id}>{e.designer?.name ?? "Unknown"}{e.title ? ` — ${e.title}` : ""}</option>
            ))}
          </Select>
        </FieldGroup>
      ))}
      {error && <p className="text-xs text-danger">{error}</p>}
      <GlassButton className="px-4 py-2.5 text-sm w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </GlassButton>
      <GlassButton variant="ghost" className="px-4 py-2.5 text-sm w-full text-danger hover:text-danger hover:bg-[var(--color-danger-faint)]" onClick={handleDelete}>
        Delete challenge
      </GlassButton>
    </ModalShell>
  );
}

function SetPromptModal({ challenge, onClose, onSaved }: { challenge: DbChallenge; onClose: () => void; onSaved: () => void }) {
  const [prompt, setPrompt] = useState(challenge.prompt ?? "");
  const [placements, setPlacements] = useState<Record<1 | 2 | 3, string>>({ 1: "", 2: "", 3: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entryOptions = challenge.entries;
  const hasPodium = new Date(challenge.challenge_date).getFullYear() !== 2025;
  const posLabel: Record<number, string> = { 1: "Winner", 2: "2nd place", 3: "3rd place" };

  useEffect(() => {
    const supabase = createClient();
    supabase.from("results").select("position, entry_id").eq("challenge_id", challenge.id).then(({ data }) => {
      if (!data) return;
      const next = { 1: "", 2: "", 3: "" } as Record<1 | 2 | 3, string>;
      data.forEach((r) => {
        if (r.position === 1 || r.position === 2 || r.position === 3)
          next[r.position as 1 | 2 | 3] = r.entry_id ?? "";
      });
      setPlacements(next);
    });
  }, [challenge.id]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { error: err } = await supabase.from("challenges").update({ prompt }).eq("id", challenge.id);
    if (err) { setError(err.message); setSaving(false); return; }

    await supabase.from("results").delete().eq("challenge_id", challenge.id).in("position", [1, 2, 3]);
    const toInsert = ([1, 2, 3] as const)
      .filter((pos) => placements[pos])
      .map((pos) => ({ challenge_id: challenge.id, entry_id: placements[pos], position: pos, points_awarded: POSITION_POINTS[pos] }));
    if (toInsert.length > 0) {
      const { error: rErr } = await supabase.from("results").insert(toInsert);
      if (rErr) { setError(rErr.message); setSaving(false); return; }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <ModalShell title={challenge.prompt ? "Edit prompt" : "Set prompt"} onClose={onClose}>
      <FieldGroup label="Prompt">
        <Textarea style={{ height: 120 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="What's the challenge this week?" />
      </FieldGroup>
      {(hasPodium ? [1, 2, 3] as const : [1] as const).map((pos) => (
        <FieldGroup key={pos} label={posLabel[pos]}>
          <Select value={placements[pos]} onChange={(e) => setPlacements((p) => ({ ...p, [pos]: e.target.value }))}>
            <option value="">—</option>
            {entryOptions.map((e) => (
              <option key={e.id} value={e.id}>{e.designer?.name ?? "Unknown"}{e.title ? ` — ${e.title}` : ""}</option>
            ))}
          </Select>
        </FieldGroup>
      ))}
      {error && <p className="text-xs text-danger">{error}</p>}
      <GlassButton className="px-4 py-2.5 text-sm w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </GlassButton>
    </ModalShell>
  );
}

function ThumbnailPicker({ preview, onPick, onRemove, className, emptyLabel = "Click to add thumbnail" }: { preview: string | null; onPick: (file: File) => void; onRemove?: () => void; className?: string; emptyLabel?: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className={`group relative rounded-lg overflow-hidden cursor-pointer bg-canvas transition-colors duration-150 hover:bg-elevated ${className ?? "h-[160px]"}`}
      style={{ cursor: "pointer" }}
      onClick={() => fileRef.current?.click()}
    >
      {preview
        ? <img src={preview} alt="" className="w-full h-full object-cover cursor-pointer" />
        : emptyLabel !== null ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-fg-muted">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M2.5 11L5.5 8L7.5 10L10 7L13.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              {emptyLabel && <span className="text-sm">{emptyLabel}</span>}
            </div>
          ) : null
      }
      {preview && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-150 pointer-events-none" />}
      <div className="absolute top-2 right-2 flex items-center gap-1">
        {preview && onRemove && (
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-fg-secondary hover:text-fg-primary transition-[color,transform] duration-150 active:scale-[0.97] hover:[background:linear-gradient(var(--color-glass-hover),var(--color-glass-hover)),var(--color-surface)]"
            style={{ background: "linear-gradient(var(--color-glass-subtle), var(--color-glass-subtle)), var(--color-surface)", boxShadow: "var(--shadow-btn)" }}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Remove thumbnail"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2.5 2.5L13.5 13.5M13.5 2.5L2.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
    </div>
  );
}

function SubmitEntryModal({ challenge, myDesignerId, onClose, onSaved }: {
  challenge: DbChallenge;
  myDesignerId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [figmaUrl, setFigmaUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleThumbPick(file: File) {
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!myDesignerId) { setError("Could not find your designer profile"); return; }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { data: inserted, error: err } = await supabase.from("entries").insert({
      challenge_id: challenge.id,
      designer_id: myDesignerId,
      title: title || null,
      figma_url: figmaUrl || null,
    }).select("id").single();
    if (err) { setError(err.message); setSaving(false); return; }
    if (thumbFile && inserted) {
      try {
        const url = await uploadImage("thumbnails", `${inserted.id}.${thumbFile.name.split(".").pop()}`, thumbFile);
        await supabase.from("entries").update({ thumbnail_url: `${url}?t=${Date.now()}` }).eq("id", inserted.id);
      } catch (e: unknown) { setError((e as Error).message); setSaving(false); return; }
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <ModalShell title="Submit entry" onClose={onClose}>
      <ThumbnailPicker preview={thumbPreview} onPick={handleThumbPick} />
      <FieldGroup label="Entry title">
        <Input type="text" placeholder="Name your entry" value={title} onChange={(e) => setTitle(e.target.value)} />
      </FieldGroup>
      <FieldGroup label="Prototype link">
        <Input type="url" placeholder="https://…" value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)} />
      </FieldGroup>
      {error && <p className="text-xs text-danger">{error}</p>}
      <GlassButton className="px-4 py-2.5 text-sm w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </GlassButton>
    </ModalShell>
  );
}

function EditEntryModal({ entry, onClose, onSaved }: {
  entry: DbEntry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(entry.thumbnail_url ?? null);
  const [thumbRemoved, setThumbRemoved] = useState(false);
  const [title, setTitle] = useState(entry.title ?? "");
  const [figmaUrl, setFigmaUrl] = useState(entry.figma_url ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleThumbPick(file: File) {
    setThumbFile(file);
    setThumbRemoved(false);
    setThumbPreview(URL.createObjectURL(file));
  }

  function handleThumbRemove() {
    setThumbFile(null);
    setThumbRemoved(true);
    setThumbPreview(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    let thumbnailUrl: string | null = thumbRemoved ? null : entry.thumbnail_url;
    if (thumbRemoved || thumbFile) await deleteStorageFiles("thumbnails", entry.id);
    if (thumbFile) {
      try {
        const raw = await uploadImage("thumbnails", `${entry.id}.${thumbFile.name.split(".").pop()}`, thumbFile);
        thumbnailUrl = `${raw}?t=${Date.now()}`;
      } catch (e: unknown) { setError((e as Error).message); setSaving(false); return; }
    }
    const { error: err } = await supabase.from("entries")
      .update({ title: title || null, figma_url: figmaUrl || null, thumbnail_url: thumbnailUrl })
      .eq("id", entry.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!confirm("Delete this entry?")) return;
    const supabase = createClient();
    await supabase.from("entries").delete().eq("id", entry.id);
    onSaved();
    onClose();
  }

  return (
    <ModalShell title={`Edit entry — ${entry.designer?.name ?? "Unknown"}`} onClose={onClose}>
      <ThumbnailPicker preview={thumbPreview} onPick={handleThumbPick} onRemove={handleThumbRemove} />
      <FieldGroup label="Entry title">
        <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
      </FieldGroup>
      <FieldGroup label="Prototype link">
        <Input type="url" value={figmaUrl} onChange={(e) => setFigmaUrl(e.target.value)} />
      </FieldGroup>
      {error && <p className="text-xs text-danger">{error}</p>}
      <GlassButton className="px-4 py-2.5 text-sm w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </GlassButton>
      <GlassButton variant="ghost" className="px-4 py-2.5 text-sm w-full text-danger hover:text-danger hover:bg-[var(--color-danger-faint)]" onClick={handleDelete}>
        Delete entry
      </GlassButton>
    </ModalShell>
  );
}

function NewDesignerModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [started, setStarted] = useState({ month: "", year: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!name) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const joinedAt = started.month && started.year
      ? `${started.year}-${String(MONTHS.indexOf(started.month) + 1).padStart(2, "0")}-01`
      : new Date().toISOString().slice(0, 10);
    let avatarUrl: string | null = null;
    if (avatarFile) {
      try {
        avatarUrl = await uploadImage("avatars", `${slug}.${avatarFile.name.split(".").pop()}`, avatarFile);
      } catch (e: unknown) { setError((e as Error).message); setSaving(false); return; }
    }
    const { error: err } = await supabase.from("designers").insert({
      name, slug, location: location || null, joined_at: joinedAt, is_active: true, avatar_url: avatarUrl,
    });
    if (err) { setSaving(false); setError(err.message); return; }

    // Send invite email if email provided
    if (email) {
      const confirmUrl = `${window.location.origin}/auth/confirm`;
      const { error: inviteErr } = await inviteDesigner(email, confirmUrl);
      if (inviteErr) { setSaving(false); setError(`Designer saved, but invite failed: ${inviteErr}`); return; }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <ModalShell title="New designer" onClose={onClose}>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-elevated flex items-center justify-center text-lg text-fg-muted shrink-0 overflow-hidden">
          {avatarPreview
            ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.2" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <GlassButton onClick={() => fileRef.current?.click()} className="px-4 py-2.5 text-sm">Set avatar</GlassButton>
      </div>
      <FieldGroup label="Name"><Input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} /></FieldGroup>
      <FieldGroup label="Email"><Input type="email" placeholder="name.lastname@nortal.com" value={email} onChange={(e) => setEmail(e.target.value)} /></FieldGroup>
      <FieldGroup label="Location"><Input type="text" placeholder="City, Country" value={location} onChange={(e) => setLocation(e.target.value)} /></FieldGroup>
      <FieldGroup label="Started in Nortal"><MonthYearPicker value={started} onChange={setStarted} /></FieldGroup>
      {error && <p className="text-xs text-danger">{error}</p>}
      <GlassButton className="px-4 py-2.5 text-sm w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </GlassButton>
    </ModalShell>
  );
}

function EditDesignerModal({ designer, isSelf, onClose, onSaved }: {
  designer: DbDesigner;
  isSelf: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(designer.avatar_url);
  const [active, setActive] = useState(designer.is_active);
  const [name, setName] = useState(designer.name);
  const [location, setLocation] = useState(designer.location ?? "");
  const joinedDate = new Date(designer.joined_at);
  const [started, setStarted] = useState({
    month: MONTHS[joinedDate.getUTCMonth()],
    year: String(joinedDate.getUTCFullYear()),
  });
  const [isAdminRole, setIsAdminRole] = useState(designer.role === "admin");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  async function handleInvite() {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteStatus(null);
    const confirmUrl = `${window.location.origin}/auth/confirm`;
    const { error, userId } = await inviteDesigner(inviteEmail, confirmUrl, isAdminRole ? "admin" : "member");
    setInviting(false);
    if (error) { setInviteStatus({ ok: false, msg: error }); return; }
    // Save auth_user_id back to designer row
    if (userId) {
      const supabase = createClient();
      await supabase.from("designers").update({ auth_user_id: userId }).eq("id", designer.id);
    }
    setInviteStatus({ ok: true, msg: `Invite sent to ${inviteEmail}` });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const joinedAt = started.month && started.year
      ? `${started.year}-${String(MONTHS.indexOf(started.month) + 1).padStart(2, "0")}-01`
      : designer.joined_at;
    const leftAt = !active && designer.left_at === null
      ? new Date().toISOString().slice(0, 10)
      : active ? null : designer.left_at;
    let avatarUrl = designer.avatar_url;
    if (avatarFile) {
      await deleteStorageFiles("avatars", designer.slug);
      try {
        const rawAvatar = await uploadImage("avatars", `${designer.slug}.${avatarFile.name.split(".").pop()}`, avatarFile);
        avatarUrl = `${rawAvatar}?t=${Date.now()}`;
      } catch (e: unknown) { setError((e as Error).message); setSaving(false); return; }
    }
    const role = isAdminRole ? "admin" : "member";
    const { error: err } = await supabase.from("designers").update({
      name, location: location || null, joined_at: joinedAt, is_active: active, left_at: leftAt, avatar_url: avatarUrl, role,
    }).eq("id", designer.id);
    if (err) { setSaving(false); setError(err.message); return; }

    // Sync role to Supabase auth if user has logged in
    if (designer.auth_user_id) {
      await setAuthRole(designer.auth_user_id, role);
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <ModalShell title="Edit designer" onClose={onClose}>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-elevated flex items-center justify-center text-sm text-fg-muted font-medium shrink-0 overflow-hidden">
          {avatarPreview
            ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
            : designer.name.slice(0, 2).toUpperCase()
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <GlassButton onClick={() => fileRef.current?.click()} className="px-4 py-2.5 text-sm">Edit avatar</GlassButton>
      </div>
      <FieldGroup label="Name"><Input type="text" value={name} onChange={(e) => setName(e.target.value)} /></FieldGroup>
      <FieldGroup label="Location"><Input type="text" value={location} onChange={(e) => setLocation(e.target.value)} /></FieldGroup>
      <FieldGroup label="Started in Nortal"><MonthYearPicker value={started} onChange={setStarted} /></FieldGroup>
      <div className="flex gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-fg-muted">Active</p>
          <button
            onClick={() => setActive(!active)}
            className="relative w-10 h-[22px] rounded-full p-px cursor-pointer outline-none"
            style={{ background: active ? "var(--color-accent)" : "var(--color-elevated)", transition: "background-color 150ms ease" }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: active ? "var(--color-canvas)" : "var(--color-glass-active)",
                transform: active ? "translateX(18px)" : "translateX(0px)",
                transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            />
          </button>
        </div>
        {!isSelf && <div className="flex flex-col gap-3">
          <p className="text-sm text-fg-muted">Admin</p>
          <button
            onClick={() => setIsAdminRole(!isAdminRole)}
            className="relative w-10 h-[22px] rounded-full p-px cursor-pointer outline-none"
            style={{ background: isAdminRole ? "var(--color-accent)" : "var(--color-elevated)", transition: "background-color 150ms ease" }}
          >
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background: isAdminRole ? "var(--color-canvas)" : "var(--color-glass-active)",
                transform: isAdminRole ? "translateX(18px)" : "translateX(0px)",
                transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            />
          </button>
        </div>}
      </div>
      {!isSelf && <div className="border-t" style={{ borderColor: "var(--color-line)" }} />}

      {!isSelf && (
        designer.auth_user_id && !inviteStatus?.ok
          ? <p className="text-xs text-fg-muted">Login already linked</p>
          : <div className="flex flex-col gap-2">
              <p className="text-sm text-fg-muted">Send login invite</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="name.lastname@nortal.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <GlassButton
                  className="px-4 py-2.5 text-sm"
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviting}
                >
                  {inviting ? "Sending…" : "Send invite"}
                </GlassButton>
              </div>
              {inviteStatus && (
                <p className={`text-xs ${inviteStatus.ok ? "text-success" : "text-danger"}`}>
                  {inviteStatus.msg}
                </p>
              )}
            </div>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
      <GlassButton className="px-4 py-2.5 text-sm w-full" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </GlassButton>
    </ModalShell>
  );
}

// ─── Year dropdown ─────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function YearDropdown({ value, onChange }: { value: number; onChange: (y: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <DropdownMenu.Root onOpenChange={(open) => { if (!open) setHovered(null); }}>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm outline-none transition-colors duration-150 hover:bg-white/5" style={{ border: "0.5px solid var(--color-line)" }}>
          <span className="text-fg-primary">{value}</span>
          <span className="text-fg-muted"><ChevronDown /></span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="start"
          className="z-50 min-w-[120px] rounded-xl p-1 outline-none"
          style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-modal)", border: "0.5px solid var(--color-glass-hover)" }}
          onMouseLeave={() => setHovered(null)}
        >
          {years.map((y) => (
            <DropdownMenu.Item key={y} asChild>
              <button
                className={`relative w-full flex items-center justify-between gap-4 px-3 py-2 rounded-lg text-sm outline-none cursor-pointer ${
                  hovered === y || (!hovered && y === value) ? "text-fg-primary" : "text-fg-secondary"
                }`}
                onClick={() => onChange(y)}
                onMouseEnter={() => setHovered(y)}
              >
                {hovered === y && (
                  <motion.span
                    layoutId="year-filter-highlight"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "var(--color-glass-subtle)" }}
                    transition={{ type: "spring", duration: 0.25, bounce: 0 }}
                  />
                )}
                <span className="relative">{y}</span>
                {y === value && <span className="relative text-accent"><CheckIcon /></span>}
              </button>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Photos tab ───────────────────────────────────────────────────────────────

function PhotosTab({ seasons }: { seasons: DbSeason[] }) {
  // ── Overview collage ───────────────────────────────────────────────────────
  const [previews, setPreviews] = useState<(string | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([1, 2, 3, 4, 5].map(async (n) => {
      const { data } = await supabase.storage.from("photos").list("overview", { search: String(n) });
      const match = data?.find((f) => f.name.startsWith(String(n)));
      if (!match) return null;
      const url = supabase.storage.from("photos").getPublicUrl(`overview/${match.name}`).data.publicUrl;
      return `${url}?t=${match.updated_at ?? Date.now()}`;
    })).then((urls) => setPreviews(urls));
  }, []);

  async function handlePick(index: number, file: File) {
    const supabase = createClient();
    // Remove all existing files for this slot before uploading (avoids stale duplicates)
    const { data: existing } = await supabase.storage.from("photos").list("overview", { search: String(index + 1) });
    const old = existing?.filter((f) => f.name.startsWith(String(index + 1)));
    if (old?.length) await supabase.storage.from("photos").remove(old.map((f) => `overview/${f.name}`));

    const ext = file.name.split(".").pop();
    const path = `overview/${index + 1}.${ext}`;
    try {
      const url = await uploadImage("photos", path, file);
      setPreviews((p) => p.map((v, i) => i === index ? `${url}?t=${Date.now()}` : v));
    } catch {
      // silent
    }
  }

  async function handleRemove(index: number) {
    const supabase = createClient();
    const { data } = await supabase.storage.from("photos").list("overview", { search: String(index + 1) });
    const match = data?.find((f) => f.name.startsWith(String(index + 1)));
    if (match) await supabase.storage.from("photos").remove([`overview/${match.name}`]);
    setPreviews((p) => p.map((v, i) => i === index ? null : v));
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Overview collage */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-base text-fg-primary">Overview collage</p>
          <p className="text-sm text-fg-muted">5 photos shown in the draggable collage at the bottom of the Overview page.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {previews.map((preview, i) => (
            <ThumbnailPicker
              key={i}
              preview={preview}
              onPick={(f) => handlePick(i, f)}
              onRemove={preview ? () => handleRemove(i) : undefined}
              emptyLabel=""
              className={`h-[160px]${!previews[i] ? " border-[0.5px] border-line" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "challenges" | "designers" | "photos";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("challenges");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [modal, setModal] = useState<ActiveModal>(null);
  const [viewingAs, setViewingAs] = useState<DbDesigner | null>(null);
  const [greeting, setGreeting] = useState(greetings[0]);
  useEffect(() => { setGreeting(greetings[Math.floor(Math.random() * greetings.length)]); }, []);

  const [userName, setUserName] = useState("");
  const [myDesignerId, setMyDesignerId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [challenges, setChallenges] = useState<DbChallenge[]>([]);
  const [designers, setDesigners] = useState<DbDesigner[]>([]);
  const [seasons, setSeasons] = useState<DbSeason[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [loadingDesigners, setLoadingDesigners] = useState(false);

  const close = () => setModal(null);
  const effectiveIsAdmin = viewingAs ? viewingAs.role === "admin" : isAdmin;

  // Load auth user and match to designer profile
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const email = session?.user?.email ?? "";
      const name = email.split("@")[0].split(".")[0].replace(/\b\w/g, (c) => c.toUpperCase());
      setUserName(name);
      // Fetch role from server to reflect changes immediately without re-login
      const roleRes = await fetch("/api/me/role");
      if (roleRes.ok) {
        const { role } = await roleRes.json();
        setIsAdmin(role === "admin");
      } else {
        setIsAdmin(session?.user?.app_metadata?.role === "admin");
      }
      // Match to designer by slug (first part of email before @ or .)
      const slug = email.split("@")[0].split(".")[0].toLowerCase();
      const { data } = await supabase.from("designers").select("id").eq("slug", slug).maybeSingle();
      if (data) setMyDesignerId(data.id);
      // Auto-link auth account to designer row if not yet set
      if (session) linkDesignerAccount();
    });
  }, []);

  // Load seasons once
  useEffect(() => {
    const supabase = createClient();
    supabase.from("seasons").select("id, number, starts_at").order("number", { ascending: true })
      .then(({ data }) => { if (data) setSeasons(data); });
  }, []);

  // Load challenges when year changes
  const loadChallenges = useCallback(async () => {
    setLoadingChallenges(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("challenges")
      .select(`
        id, challenge_date, prompt, status,
        master_of_ceremony:master_of_ceremony_id(slug, name),
        entries(id, title, figma_url, thumbnail_url, designer_id, designer:designer_id(id, slug, name, avatar_url))
      `)
      .gte("challenge_date", `${selectedYear}-01-01`)
      .lt("challenge_date", `${selectedYear + 1}-01-01`)
      .order("challenge_date", { ascending: false });
    setLoadingChallenges(false);
    if (data) setChallenges(data as unknown as DbChallenge[]);
  }, [selectedYear]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);

  // Load designers on mount (needed for modals on both tabs)
  const loadDesigners = useCallback(async () => {
    setLoadingDesigners(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("designers")
      .select("id, slug, name, role, location, joined_at, is_active, left_at, avatar_url, auth_user_id")
      .order("joined_at", { ascending: true });
    setLoadingDesigners(false);
    if (data) setDesigners(data);
  }, []);

  useEffect(() => { loadDesigners(); }, [loadDesigners]);

  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [modal]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="flex flex-col items-center gap-12 py-12 sm:gap-20 sm:py-20 min-h-screen">
      <style>{`*, *::before, *::after { cursor: auto !important; } button, a, button *, a * { cursor: pointer !important; }`}</style>
      <Nav />

      <PageTransition>
        <div className="flex flex-col gap-10 w-full max-w-[800px] mx-auto px-4 sm:px-6">

          {/* View-as banner */}
          {viewingAs && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-elevated">
              <p className="text-sm text-fg-secondary">
                Viewing as <span className="text-fg-primary">{viewingAs.name}</span>
              </p>
              <button
                onClick={() => setViewingAs(null)}
                className="text-sm text-fg-secondary hover:text-fg-primary underline underline-offset-2 cursor-pointer transition-colors duration-150"
              >
                Exit
              </button>
            </div>
          )}

          {/* Greeting row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-4">
            <h1 className="text-3xl text-fg-primary">{greeting}{userName ? `, ${userName.split(" ")[0]}` : ""}</h1>

            {effectiveIsAdmin && <div className="flex items-center p-1 rounded-full text-sm w-full sm:w-auto" style={{ border: "0.5px solid var(--color-line)" }}>
              {(["challenges", "designers", "photos"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full capitalize transition-colors duration-150 outline-none ${
                    activeTab === tab ? "text-fg-primary" : "text-fg-muted hover:text-fg-primary"
                  }`}
                  style={activeTab === tab ? { background: "var(--color-surface)", boxShadow: "var(--shadow-default)" } : {}}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>}
          </div>

          {/* Challenges tab */}
          {activeTab === "challenges" && (
            <>
              <div className="flex items-center justify-between gap-4">
                <YearDropdown value={selectedYear} onChange={setSelectedYear} />
                {effectiveIsAdmin && <GlassButton className="px-4 py-2.5 text-sm" onClick={() => setModal({ kind: "new-challenge" })}>
                  New challenge
                </GlassButton>}
              </div>

              <div className="flex flex-col gap-4">
                {loadingChallenges ? (
                  <p className="text-sm text-fg-muted text-center py-8">Loading…</p>
                ) : challenges.length === 0 ? (
                  <p className="text-sm text-fg-muted text-center py-8">No challenges for {selectedYear}</p>
                ) : (
                  challenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className="flex items-start justify-between gap-6 p-5 rounded-2xl bg-surface"
                      style={{ boxShadow: "var(--shadow-default)" }}
                    >
                      <div className="flex flex-col gap-3 min-w-0 flex-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-fg-muted">{formatDate(challenge.challenge_date)}</p>
                            {challenge.status === "open" && (
                              <span className="text-xs px-2 py-0.5 rounded-full text-success bg-success/10">Active</span>
                            )}
                          </div>
                          <p className="text-sm text-fg-primary">{challenge.prompt ?? <span className="text-fg-muted italic">No prompt set</span>}</p>
                        </div>
                        {challenge.entries.length > 0 && (
                          <div className="flex items-center">
                            {challenge.entries.map((entry, i) => (
                              <Avatar
                                key={entry.id}
                                name={entry.designer?.name ?? "?"}
                                src={entry.designer?.avatar_url}
                                className="w-7 h-7 text-[10px]"
                                style={{ marginLeft: i === 0 ? 0 : -6, zIndex: i, boxShadow: "0 0 0 1.5px var(--color-surface)" }}
                              />
                            ))}
                          </div>
                        )}
                        {effectiveIsAdmin && <button
                          onClick={() => setModal({ kind: "edit-challenge", challenge })}
                          className="w-fit text-sm text-fg-secondary hover:text-fg-primary underline underline-offset-2 cursor-pointer outline-none transition-colors duration-150"
                        >
                          Edit challenge
                        </button>}
                        {viewingAs && viewingAs.slug === challenge.master_of_ceremony?.slug && !effectiveIsAdmin && (
                          <button
                            onClick={() => setModal({ kind: "set-prompt", challenge })}
                            className="w-fit text-sm text-fg-secondary hover:text-fg-primary underline underline-offset-2 cursor-pointer outline-none transition-colors duration-150"
                          >
                            {challenge.prompt ? "Edit challenge" : "Set prompt"}
                          </button>
                        )}
                      </div>
                      {(() => {
                        const effectiveId = viewingAs?.id ?? myDesignerId;
                        const myEntry = effectiveId ? challenge.entries.find((e) => e.designer_id === effectiveId) : null;
                        return myEntry ? (
                          <GlassButton
                            className="px-4 py-2.5 text-sm shrink-0"
                            onClick={() => setModal({ kind: "edit-entry", challenge, entry: myEntry })}
                          >
                            Edit entry
                          </GlassButton>
                        ) : (
                          <GlassButton
                            className="px-4 py-2.5 text-sm shrink-0"
                            onClick={() => setModal({ kind: "submit-entry", challenge })}
                          >
                            Submit entry
                          </GlassButton>
                        );
                      })()}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Designers tab */}
          {activeTab === "designers" && (
            <>
              {effectiveIsAdmin && <div className="flex justify-end">
                <GlassButton className="px-4 py-2.5 text-sm" onClick={() => setModal({ kind: "new-designer" })}>
                  Add designer
                </GlassButton>
              </div>}
              <div className="flex flex-col gap-4">
                {loadingDesigners ? (
                  <p className="text-sm text-fg-muted text-center py-8">Loading…</p>
                ) : (
                  [...designers].sort((a, b) => Number(b.is_active) - Number(a.is_active)).map((designer) => (
                    <div
                      key={designer.id}
                      className="flex items-center justify-between gap-5 p-5 rounded-2xl bg-surface"
                      style={{ boxShadow: "var(--shadow-default)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={designer.name} src={designer.avatar_url} className="w-12 h-12 text-sm" />
                        <div className="flex flex-col min-w-0">
                          <p className={`text-base ${designer.is_active ? "text-fg-primary" : "text-fg-secondary"}`}>{designer.name}</p>
                          <p className="text-sm text-fg-muted">
                            {[
                              designer.location,
                              designer.is_active
                                ? `Active since ${new Date(designer.joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                                : `Last seen ${new Date(designer.left_at ?? designer.joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
                            ].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {effectiveIsAdmin && <GlassButton
                          variant="ghost"
                          className="px-4 py-2.5 text-sm"
                          onClick={() => { setViewingAs(designer); setActiveTab("challenges"); }}
                        >
                          View as
                        </GlassButton>}
                        {effectiveIsAdmin && <GlassButton
                          className="px-4 py-2.5 text-sm"
                          onClick={() => setModal({ kind: "edit-designer", designer })}
                        >
                          Edit
                        </GlassButton>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "photos" && (
            <PhotosTab seasons={seasons} />
          )}

        </div>
      </PageTransition>

      {/* Modals */}
      <AnimatePresence>
        {modal?.kind === "new-challenge" && (
          <NewChallengeModal designers={designers.length ? designers : []} seasons={seasons} onClose={close} onSaved={loadChallenges} />
        )}
        {modal?.kind === "edit-challenge" && (
          <EditChallengeModal challenge={modal.challenge} designers={designers} onClose={close} onSaved={loadChallenges} />
        )}
        {modal?.kind === "submit-entry" && (
          <SubmitEntryModal challenge={modal.challenge} myDesignerId={viewingAs?.id ?? myDesignerId} onClose={close} onSaved={loadChallenges} />
        )}
        {modal?.kind === "edit-entry" && (
          <EditEntryModal entry={modal.entry} onClose={close} onSaved={loadChallenges} />
        )}
        {modal?.kind === "set-prompt" && (
          <SetPromptModal challenge={modal.challenge} onClose={close} onSaved={loadChallenges} />
        )}

        {modal?.kind === "new-designer" && (
          <NewDesignerModal onClose={close} onSaved={loadDesigners} />
        )}
        {modal?.kind === "edit-designer" && (
          <EditDesignerModal designer={modal.designer} isSelf={modal.designer.id === myDesignerId} onClose={close} onSaved={loadDesigners} />
        )}
      </AnimatePresence>
    </div>
  );
}
