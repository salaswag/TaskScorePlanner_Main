
import { useState } from "react";
import { User, LogOut, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export default function UserMenu() {
  const { user, login, signup, logout, isLoginLoading, isSignupLoading, loginError, signupError } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [signupData, setSignupData] = useState({ username: "", password: "" });

  const handleLogin = (e) => {
    e.preventDefault();
    login(loginData, {
      onSuccess: () => {
        setIsLoginOpen(false);
        setLoginData({ username: "", password: "" });
      }
    });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    signup(signupData, {
      onSuccess: () => {
        setIsSignupOpen(false);
        setSignupData({ username: "", password: "" });
      }
    });
  };

  const handleLogout = () => {
    logout();
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <User className="mr-2 h-4 w-4" />
            {user.username}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Login Dialog */}
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Login</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Enter your credentials to access your tasks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username" className="text-black dark:text-white">Username</Label>
              <Input
                id="login-username"
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
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
              <p className="text-sm text-red-600 dark:text-red-400">{loginError.message}</p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" 
              disabled={isLoginLoading}
            >
              {isLoginLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Sign Up</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new account to start managing your tasks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username" className="text-black dark:text-white">Username</Label>
              <Input
                id="signup-username"
                type="text"
                value={signupData.username}
                onChange={(e) => setSignupData(prev => ({ ...prev, username: e.target.value }))}
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
              <p className="text-sm text-red-600 dark:text-red-400">{signupError.message}</p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" 
              disabled={isSignupLoading}
            >
              {isSignupLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
