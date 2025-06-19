
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function UserMenu() {
  const { user, login, signup, logout, isLoginLoading, isSignupLoading, loginError, signupError } = useAuth();
  
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "" });

  const handleLogin = (e) => {
    e.preventDefault();
    login(loginData);
    setIsLoginOpen(false);
    setLoginData({ email: "", password: "" });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    signup(signupData);
    setIsSignupOpen(false);
    setSignupData({ email: "", password: "" });
  };

  const handleLogout = () => {
    logout();
  };

  if (user && !user.isAnonymous) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-black dark:text-white">
          Welcome, {user.email}
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {user?.isAnonymous && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
          Save your tasks by signing in
        </span>
      )}
      
      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Sign In</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {user?.isAnonymous 
                ? "Your current tasks will be saved to your account." 
                : "Enter your credentials to access your tasks."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-black dark:text-white">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-black dark:text-white">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                required
                className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700"
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {loginError.message}
              </p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-black dark:text-white border-black dark:border-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Sign Up</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {user?.isAnonymous 
                ? "Create an account to save your current tasks permanently." 
                : "Create a new account to start managing your tasks."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-black dark:text-white">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-black dark:text-white">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                required
                className="bg-white dark:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700"
              />
            </div>
            {signupError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {signupError.message}
              </p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
              disabled={isSignupLoading}
            >
              {isSignupLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
