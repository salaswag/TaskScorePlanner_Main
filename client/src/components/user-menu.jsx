import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Mail, 
  Lock, 
  AlertCircle,
  Settings
} from "lucide-react";

function UserMenu() {
  const { user, login, signup, logout, isLoginLoading, isSignupLoading, loginError, signupError } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", confirmPassword: "" });
  const [activeTab, setActiveTab] = useState("login");
  const [localErrors, setLocalErrors] = useState({ login: "", signup: "" });

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalErrors(prev => ({ ...prev, login: "" }));

    if (!loginData.email || !loginData.password) {
      setLocalErrors(prev => ({ ...prev, login: "Please fill in all fields" }));
      return;
    }

    if (!validateEmail(loginData.email)) {
      setLocalErrors(prev => ({ ...prev, login: "Please enter a valid email address" }));
      return;
    }

    try {
      const currentUser = user;
      const loggedInUser = await login(loginData.email, loginData.password);

      // Transfer data if user was anonymous
      if (currentUser && currentUser.isAnonymous && loggedInUser) {
        try {
          console.log('🔄 Transferring data from anonymous to authenticated user...');
          const response = await fetch('/api/auth/transfer-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await loggedInUser.getIdToken()}`
            },
            body: JSON.stringify({
              anonymousUid: currentUser.uid,
              permanentUid: loggedInUser.uid
            })
          });

          if (response.ok) {
            console.log('✅ Data transfer successful');
            // Refresh tasks after data transfer
            window.location.reload();
          } else {
            console.warn('⚠️ Data transfer failed, but login successful');
          }
        } catch (transferError) {
          console.error('❌ Data transfer error:', transferError);
          // Don't fail login due to transfer error
        }
      }

      setIsOpen(false);
      setLoginData({ email: "", password: "" });
      setLocalErrors({ login: "", signup: "" });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLocalErrors(prev => ({ ...prev, signup: "" }));

    if (!signupData.email || !signupData.password || !signupData.confirmPassword) {
      setLocalErrors(prev => ({ ...prev, signup: "Please fill in all fields" }));
      return;
    }

    if (!validateEmail(signupData.email)) {
      setLocalErrors(prev => ({ ...prev, signup: "Please enter a valid email address" }));
      return;
    }

    if (signupData.password.length < 6) {
      setLocalErrors(prev => ({ ...prev, signup: "Password must be at least 6 characters long" }));
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setLocalErrors(prev => ({ ...prev, signup: "Passwords do not match" }));
      return;
    }

    try {
      const currentUser = user;
      const newUser = await signup(signupData.email, signupData.password);

      // Transfer data if user was anonymous
      if (currentUser && currentUser.isAnonymous && newUser) {
        try {
          console.log('🔄 Transferring data from anonymous to new authenticated user...');
          const response = await fetch('/api/auth/transfer-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await newUser.getIdToken()}`
            },
            body: JSON.stringify({
              anonymousUid: currentUser.uid,
              permanentUid: newUser.uid
            })
          });

          if (response.ok) {
            console.log('✅ Data transfer successful');
            // Refresh tasks after data transfer
            window.location.reload();
          } else {
            console.warn('⚠️ Data transfer failed, but signup successful');
          }
        } catch (transferError) {
          console.error('❌ Data transfer error:', transferError);
          // Don't fail signup due to transfer error
        }
      }

      setIsOpen(false);
      setSignupData({ email: "", password: "", confirmPassword: "" });
      setLocalErrors({ login: "", signup: "" });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Show user info if authenticated
  if (user && !user.isAnonymous) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1 sm:gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 sm:p-2"
          >
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">
              {user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-2 p-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-gray-500">Signed in</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Show sign in/up buttons for anonymous users
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                <User className="h-3 w-3" />
                <span className="hidden sm:inline">Sign In / Up</span>
                <span className="sm:hidden">Sign In</span>
              </Button>
            </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
                <DialogHeader className="text-center space-y-2">
                  <DialogTitle className="text-lg sm:text-xl">Welcome to TaskMaster Pro</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Sign in to sync your tasks across devices or create a new account
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
                          <div className="p-3 text-xs sm:text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            {localErrors.login || loginError}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="login-email" className="text-xs sm:text-sm font-medium">Email</Label>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            className="h-10 text-sm"
                            value={loginData.email}
                            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                            disabled={isLoginLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className="text-xs sm:text-sm font-medium">Password</Label>
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            className="h-10 text-sm"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            disabled={isLoginLoading}
                          />
                        </div>
                        <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={isLoginLoading}>
                          {isLoginLoading ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup" className="space-y-4 mt-0">
                      <form onSubmit={handleSignup} className="space-y-4">
                        {(signupError || localErrors.signup) && (
                          <div className="p-3 text-xs sm:text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                            {localErrors.signup || signupError}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-xs sm:text-sm font-medium">Email</Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            className="h-10 text-sm"
                            value={signupData.email}
                            onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                            disabled={isSignupLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className="text-xs sm:text-sm font-medium">Password</Label>
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Minimum 6 characters"
                            className="h-10 text-sm"
                            value={signupData.password}
                            onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                            disabled={isSignupLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-confirm-password" className="text-xs sm:text-sm font-medium">Confirm Password</Label>
                          <Input
                            id="signup-confirm-password"
                            type="password"
                            placeholder="Confirm your password"
                            className="h-10 text-sm"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            disabled={isSignupLoading}
                          />
                        </div>
                        <Button type="submit" className="w-full h-10 text-sm font-medium" disabled={isSignupLoading}>
                          {isSignupLoading ? "Creating account..." : "Sign Up"}
                        </Button>
                      </form>
                    </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
  );
}

export { UserMenu };
export default UserMenu;