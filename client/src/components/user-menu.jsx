
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
    login(loginData);
    setIsLoginOpen(false);
    setLoginData({ username: "", password: "" });
  };

  const handleSignup = (e) => {
    e.preventDefault();
    signup(signupData);
    setIsSignupOpen(false);
    setSignupData({ username: "", password: "" });
  };

  const handleLogout = () => {
    logout();
  };

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-10 w-10 rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Logged in
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your tasks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-600">{loginError.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isSignupOpen} onOpenChange={setIsSignupOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Sign Up
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign Up</DialogTitle>
            <DialogDescription>
              Create a new account to save your tasks.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                type="text"
                value={signupData.username}
                onChange={(e) => setSignupData(prev => ({ ...prev, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            {signupError && (
              <p className="text-sm text-red-600">{signupError.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSignupLoading}>
              {isSignupLoading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
