import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Palette,
  Sparkles,
  Waves,
  SunMedium,
  Trees,
  Flower2,
  Flame,
  Key,
  Check,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Zap,
  Skull,
  Eclipse,
  ChevronRight,
} from "lucide-react";

const visualThemes = [
  { id: "default", label: "Default", icon: Palette },
  { id: "aurora", label: "Aurora", icon: Sparkles },
  { id: "ocean", label: "Ocean", icon: Waves },
  { id: "sunset", label: "Sunset", icon: SunMedium },
  { id: "forest", label: "Forest", icon: Trees },
  { id: "rose", label: "Rose", icon: Flower2 },
  { id: "ember", label: "Ember", icon: Flame },
  { id: "midnight", label: "Midnight", icon: Eclipse },
  { id: "crimson", label: "Crimson", icon: Skull },
  { id: "neon", label: "Neon", icon: Zap },
];

const appearances = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
];

/* ───────── Hover submenu item ───────── */
function HoverSubmenuItem({ icon: Icon, label, children }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const itemRef = useRef(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Menu row */}
      <div className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-default hover:bg-gray-100 dark:hover:bg-gray-800 mx-1">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1">{label}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
      </div>

      {/* Flyout submenu */}
      {open && (
        <div
          className="absolute right-full top-0 mr-1 z-[300] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-right-1 duration-100"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ───────── Appearance submenu content ───────── */
function AppearanceSubmenu() {
  const { theme, setTheme } = useTheme();
  return (
    <div style={{ minWidth: 180 }}>
      <div className="px-3 pt-2.5 pb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Appearance</span>
      </div>
      <div className="px-3 pb-3">
        <div className="grid grid-cols-3 gap-1.5">
          {appearances.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs font-medium ${
                theme === id
                  ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── Visual Style submenu content ───────── */
function VisualStyleSubmenu() {
  const { visualTheme, setVisualTheme } = useTheme();
  return (
    <div style={{ minWidth: 200 }}>
      <div className="px-3 pt-2.5 pb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Visual Style</span>
      </div>
      <div className="px-3 pb-3">
        <div className="grid grid-cols-2 gap-1">
          {visualThemes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setVisualTheme(id)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border-2 transition-all text-xs ${
                visualTheme === id
                  ? "border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {visualTheme === id && <Check className="h-3 w-3 text-green-500 shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────── API Config floating panel (click-based, keeps dropdown concept) ───────── */
function ApiConfigPanel({ onClose, user }) {
  const panelRef = useRef(null);
  const [apiKey, setApiKey] = useState("");
  const [voicePrompt, setVoicePrompt] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [hasServerKey, setHasServerKey] = useState(false);
  const isAnonymous = !user || user.isAnonymous;

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => { clearTimeout(timer); document.removeEventListener("mousedown", handler); };
  }, [onClose]);

  useEffect(() => { loadSettings(); }, []);

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
        setMessage({ type: "error", text: data.message || "Failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
    setSaving(false);
  };

  return (
    <div
      ref={panelRef}
      className="fixed top-14 right-3 z-[200] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150"
      style={{ minWidth: 220 }}
    >
      <div className="px-3 pt-2.5 pb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">API Configuration</span>
      </div>
      <div className="px-3 pb-3" style={{ width: 280 }}>
        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {isAnonymous && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md p-1.5">
                Stored locally. Sign in to sync.
              </p>
            )}
            <div className="space-y-1">
              <Label className="text-xs">OpenAI API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasServerKey ? "Key saved" : "sk-..."}
                  className="pr-8 text-xs h-7"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Voice Prompt</Label>
              <Textarea
                value={voicePrompt}
                onChange={(e) => setVoicePrompt(e.target.value)}
                placeholder="Convert transcript into bullet points..."
                rows={2}
                className="text-xs resize-none"
              />
            </div>
            {message && (
              <p className={`text-[10px] rounded-md px-2 py-1 ${
                message.type === "success"
                  ? "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
                  : "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
              }`}>{message.text}</p>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving} className="w-full h-7 text-xs">
              {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Main UserMenu ───────── */
function UserMenu() {
  const { user, login, signup, logout, isLoginLoading, isSignupLoading, loginError, signupError } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "" });
  const [activeTab, setActiveTab] = useState("login");
  const [localErrors, setLocalErrors] = useState({ login: "", signup: "" });
  const [showApiPanel, setShowApiPanel] = useState(false);

  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalErrors(prev => ({ ...prev, login: "" }));
    if (!loginData.email || !loginData.password) {
      setLocalErrors(prev => ({ ...prev, login: "Please fill in all fields" }));
      return;
    }
    if (!validateEmail(loginData.email)) {
      setLocalErrors(prev => ({ ...prev, login: "Please enter a valid email" }));
      return;
    }
    try {
      const currentUser = user;
      const loggedInUser = await login(loginData.email, loginData.password);
      if (currentUser && currentUser.isAnonymous && loggedInUser) {
        try {
          const response = await fetch('/api/auth/transfer-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await loggedInUser.getIdToken()}` },
            body: JSON.stringify({ anonymousUid: currentUser.uid, permanentUid: loggedInUser.uid })
          });
          if (response.ok) window.location.reload();
        } catch (e) { console.error('Data transfer error:', e); }
      }
      setIsOpen(false);
      setLoginData({ email: "", password: "" });
      setLocalErrors({ login: "", signup: "" });
    } catch (error) {}
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLocalErrors(prev => ({ ...prev, signup: "" }));
    if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
      setLocalErrors(prev => ({ ...prev, signup: "Please fill in all fields" }));
      return;
    }
    if (!validateEmail(signupData.email)) {
      setLocalErrors(prev => ({ ...prev, signup: "Please enter a valid email" }));
      return;
    }
    if (signupData.password.length < 6) {
      setLocalErrors(prev => ({ ...prev, signup: "Password must be at least 6 characters" }));
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setLocalErrors(prev => ({ ...prev, signup: "Passwords do not match" }));
      return;
    }
    try {
      const currentUser = user;
      const newUser = await signup(signupData.email, signupData.password);
      if (currentUser && currentUser.isAnonymous && newUser) {
        try {
          const response = await fetch('/api/auth/transfer-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await newUser.getIdToken()}` },
            body: JSON.stringify({ anonymousUid: currentUser.uid, permanentUid: newUser.uid })
          });
          if (response.ok) window.location.reload();
        } catch (e) { console.error('Data transfer error:', e); }
      }
      setIsOpen(false);
      setSignupData({ email: "", password: "", confirmPassword: "" });
      setLocalErrors({ login: "", signup: "" });
    } catch (error) {}
  };

  const AppearanceIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  // ── Authenticated user ──
  if (user && !user.isAnonymous) {
    return (
      <>
        <div ref={dropdownRef} className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 sm:gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 sm:p-2"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">{user.email}</span>
          </Button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-[200] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150" style={{ minWidth: 230 }}>
              {/* User info */}
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-gray-500">Signed in</p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              {/* Hover submenu items */}
              <HoverSubmenuItem icon={AppearanceIcon} label="Appearance">
                <AppearanceSubmenu />
              </HoverSubmenuItem>

              <HoverSubmenuItem icon={Palette} label="Visual Style">
                <VisualStyleSubmenu />
              </HoverSubmenuItem>

              {/* API Config — click opens a separate panel */}
              <div
                onClick={() => { setShowApiPanel(true); setDropdownOpen(false); }}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-default hover:bg-gray-100 dark:hover:bg-gray-800 mx-1"
              >
                <Key className="w-4 h-4 shrink-0" />
                <span className="flex-1">API Configuration</span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

              {/* Sign out */}
              <div
                onClick={() => { logout(); setDropdownOpen(false); }}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-default hover:bg-gray-100 dark:hover:bg-gray-800 mx-1 text-red-600"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="flex-1">Sign Out</span>
              </div>
            </div>
          )}
        </div>

        {/* API Config panel — separate floating card (has form inputs, needs click) */}
        {showApiPanel && <ApiConfigPanel onClose={() => setShowApiPanel(false)} user={user} />}
      </>
    );
  }

  // ── Anonymous user ──
  return (
    <>
      <div ref={dropdownRef} className="relative">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <User className="h-3 w-3" />
          <span className="hidden sm:inline">Sign In / Up</span>
          <span className="sm:hidden">Sign In</span>
        </Button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1 z-[200] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg py-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150" style={{ minWidth: 200 }}>
            <div
              onClick={() => { setIsOpen(true); setDropdownOpen(false); }}
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-default hover:bg-gray-100 dark:hover:bg-gray-800 mx-1"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span className="flex-1">Sign In / Sign Up</span>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            <HoverSubmenuItem icon={AppearanceIcon} label="Appearance">
              <AppearanceSubmenu />
            </HoverSubmenuItem>

            <HoverSubmenuItem icon={Palette} label="Visual Style">
              <VisualStyleSubmenu />
            </HoverSubmenuItem>

            <div
              onClick={() => { setShowApiPanel(true); setDropdownOpen(false); }}
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-default hover:bg-gray-100 dark:hover:bg-gray-800 mx-1"
            >
              <Key className="w-4 h-4 shrink-0" />
              <span className="flex-1">API Configuration</span>
            </div>
          </div>
        )}
      </div>

      {/* Auth dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Welcome to TaskMaster Pro</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Sign in to sync your tasks across devices
            </DialogDescription>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-9">
              <TabsTrigger value="login" className="text-xs sm:text-sm px-2">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-xs sm:text-sm px-2">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="space-y-4 mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                {(loginError || localErrors.login) && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    {localErrors.login || loginError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-xs sm:text-sm">Email</Label>
                  <Input id="login-email" type="email" placeholder="Enter your email" className="h-10 text-sm"
                    value={loginData.email} onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))} disabled={isLoginLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-xs sm:text-sm">Password</Label>
                  <Input id="login-password" type="password" placeholder="Enter your password" className="h-10 text-sm"
                    value={loginData.password} onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))} disabled={isLoginLoading} />
                </div>
                <Button type="submit" className="w-full h-10 text-sm" disabled={isLoginLoading}>
                  {isLoginLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-0">
              <form onSubmit={handleSignup} className="space-y-4">
                {(signupError || localErrors.signup) && (
                  <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    {localErrors.signup || signupError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-xs sm:text-sm">Email</Label>
                  <Input id="signup-email" type="email" placeholder="Enter your email" className="h-10 text-sm"
                    value={signupData.email} onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))} disabled={isSignupLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-xs sm:text-sm">Password</Label>
                  <Input id="signup-password" type="password" placeholder="Minimum 6 characters" className="h-10 text-sm"
                    value={signupData.password} onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))} disabled={isSignupLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-xs sm:text-sm">Confirm Password</Label>
                  <Input id="signup-confirm-password" type="password" placeholder="Confirm your password" className="h-10 text-sm"
                    value={signupData.confirmPassword} onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))} disabled={isSignupLoading} />
                </div>
                <Button type="submit" className="w-full h-10 text-sm" disabled={isSignupLoading}>
                  {isSignupLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* API Config panel */}
      {showApiPanel && <ApiConfigPanel onClose={() => setShowApiPanel(false)} user={user} />}
    </>
  );
}

export { UserMenu };
export default UserMenu;
