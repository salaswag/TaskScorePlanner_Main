import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sun, Moon, Monitor, Check, Save, Eye, EyeOff, Loader2,
  Palette, Sparkles, Waves, SunMedium, Trees, Flower2, Flame,
} from "lucide-react";

const themes = [
  { id: "default", label: "Default", icon: Palette },
  { id: "aurora", label: "Aurora", icon: Sparkles },
  { id: "ocean", label: "Ocean", icon: Waves },
  { id: "sunset", label: "Sunset", icon: SunMedium },
  { id: "forest", label: "Forest", icon: Trees },
  { id: "rose", label: "Rose", icon: Flower2 },
  { id: "ember", label: "Ember", icon: Flame },
];

const appearances = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

export function SettingsPanel({ open, onOpenChange, theme, setTheme, visualTheme, setVisualTheme, user }) {
  const [apiKey, setApiKey] = useState("");
  const [voicePrompt, setVoicePrompt] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [hasServerKey, setHasServerKey] = useState(false);

  const isAnonymous = !user || user.isAnonymous;

  useEffect(() => {
    if (open) loadSettings();
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    setMessage(null);
    if (isAnonymous) {
      const stored = localStorage.getItem("app-settings");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setApiKey(parsed.openaiApiKey || "");
          setVoicePrompt(parsed.voicePrompt || "");
        } catch {}
      }
      setLoading(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/settings", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.openaiApiKey || "");
        setVoicePrompt(data.voicePrompt || "");
        setHasServerKey(data.hasApiKey || false);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    if (isAnonymous) {
      localStorage.setItem("app-settings", JSON.stringify({ openaiApiKey: apiKey, voicePrompt }));
      setMessage({ type: "success", text: "Saved locally" });
      setSaving(false);
      return;
    }
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ openaiApiKey: apiKey, voicePrompt }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Saved" });
        if (apiKey && !apiKey.startsWith("***")) setHasServerKey(true);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.message || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-80 sm:w-[360px] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-base">Settings</SheetTitle>
        </SheetHeader>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {/* ── Appearance ── */}
          <div className="px-5 py-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Appearance
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {appearances.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                    theme === id
                      ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Visual Style ── */}
          <div className="px-5 py-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Visual Style
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {themes.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setVisualTheme(id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-sm ${
                    visualTheme === id
                      ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {visualTheme === id && <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── API Configuration ── */}
          <div className="px-5 py-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              API Configuration
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                {isAnonymous && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
                    Settings stored locally. Sign in to sync.
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={hasServerKey ? "Key saved — enter new to replace" : "sk-..."}
                      className="pr-9 text-xs h-8"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">For voice transcription & text formatting.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Voice Prompt</Label>
                  <Textarea
                    value={voicePrompt}
                    onChange={(e) => setVoicePrompt(e.target.value)}
                    placeholder="Convert transcript into concise bullet points..."
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                {message && (
                  <p className={`text-xs rounded-md px-2 py-1 ${
                    message.type === "success"
                      ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
                      : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
                  }`}>
                    {message.text}
                  </p>
                )}

                <Button size="sm" onClick={handleSave} disabled={saving} className="w-full h-8 text-xs">
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  Save API Settings
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
