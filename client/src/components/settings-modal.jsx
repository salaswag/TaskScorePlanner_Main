import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Key, Save, Eye, EyeOff, Loader2 } from "lucide-react";

export function SettingsModal({ open, onOpenChange, user }) {
  const [apiKey, setApiKey] = useState("");
  const [voicePrompt, setVoicePrompt] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [hasServerKey, setHasServerKey] = useState(false);

  const isAnonymous = !user || user.isAnonymous;

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    setMessage(null);

    if (isAnonymous) {
      // Load from localStorage for anonymous users
      const stored = localStorage.getItem("app-settings");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setApiKey(parsed.openaiApiKey || "");
          setVoicePrompt(parsed.voicePrompt || "");
        } catch (e) {
          // ignore parse error
        }
      }
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      // Save to localStorage for anonymous users
      localStorage.setItem(
        "app-settings",
        JSON.stringify({ openaiApiKey: apiKey, voicePrompt })
      );
      setMessage({ type: "success", text: "Settings saved locally" });
      setSaving(false);
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ openaiApiKey: apiKey, voicePrompt }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Settings saved successfully" });
        if (apiKey && !apiKey.startsWith("***")) {
          setHasServerKey(true);
        }
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.message || "Failed to save" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error — could not save" });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Configuration
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {isAnonymous && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md p-2">
                Settings are stored locally only. Sign in to sync across devices.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-key" className="text-sm font-medium">
                OpenAI API Key
              </Label>
              <div className="relative">
                <Input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasServerKey ? "Key saved — enter new to replace" : "sk-..."}
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for voice transcription (Whisper) and text formatting (GPT-4o-mini).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice-prompt" className="text-sm font-medium">
                Voice Transcription Prompt
              </Label>
              <Textarea
                id="voice-prompt"
                value={voicePrompt}
                onChange={(e) => setVoicePrompt(e.target.value)}
                placeholder="Convert the following transcript into concise bullet points. Keep it brief and organized."
                rows={3}
                className="text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Customize how voice recordings are formatted. Leave empty for default bullet points.
              </p>
            </div>

            {message && (
              <div
                className={`text-xs rounded-md p-2 ${
                  message.type === "success"
                    ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
                    : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
