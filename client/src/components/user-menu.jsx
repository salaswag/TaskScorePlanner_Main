
import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  AlertCircle,
  Sparkles,
  Shield,
  CheckCircle
} from 'lucide-react';

export default function UserMenu() {
  const { user, login, signup, logout, isLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ email: '', password: '', confirmPassword: '' });
  const [loginError, setLoginError] = useState(null);
  const [signupError, setSignupError] = useState(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoginLoading(true);
    
    try {
      await login(loginData.email, loginData.password);
      setIsOpen(false);
      setLoginData({ email: '', password: '' });
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError(error);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError(null);
    
    if (signupData.password !== signupData.confirmPassword) {
      setSignupError({ message: 'Passwords do not match' });
      return;
    }
    
    setIsSignupLoading(true);
    
    try {
      await signup(signupData.email, signupData.password);
      setIsOpen(false);
      setSignupData({ email: '', password: '', confirmPassword: '' });
    } catch (error) {
      console.error('Signup failed:', error);
      setSignupError(error);
    } finally {
      setIsSignupLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (user && user.uid) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {user.email || 'User'}
          </span>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950 dark:hover:border-red-800"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 dark:from-blue-950 dark:to-purple-950 dark:border-blue-800">
          <User className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-0 shadow-2xl">
        <div className="relative">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"></div>
          
          <div className="relative p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to TaskMaster Pro
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to sync your tasks across all devices
              </p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-1 shadow-inner">
                <TabsTrigger 
                  value="signin" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 transition-all duration-200 font-medium"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:bg-gray-700 transition-all duration-200 font-medium"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-6 mt-8">
                <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="space-y-2 pb-6">
                    <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-blue-600" />
                      Sign in to your account
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Access your saved tasks and continue where you left off
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className="text-gray-700 dark:text-gray-300 font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="Enter your email"
                            value={loginData.email}
                            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            className="pl-10 h-12 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password" className="text-gray-700 dark:text-gray-300 font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="login-password"
                            type="password"
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            className="pl-10 h-12 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {loginError && (
                        <Alert className="border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-950/30 backdrop-blur-sm">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <AlertDescription className="text-red-700 dark:text-red-400">
                            {loginError.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] font-medium"
                        disabled={isLoginLoading}
                      >
                        {isLoginLoading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Signing in...
                          </div>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4 mr-2" />
                            Sign In
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup" className="space-y-6 mt-8">
                <Card className="border-0 shadow-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardHeader className="space-y-2 pb-6">
                    <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                      Create your account
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      Join thousands of users managing their tasks efficiently
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-300 font-medium">
                          Email Address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signupData.email}
                            onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                            required
                            className="pl-10 h-12 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-gray-700 dark:text-gray-300 font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password"
                            value={signupData.password}
                            onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                            required
                            className="pl-10 h-12 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-gray-700 dark:text-gray-300 font-medium">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="signup-confirm-password"
                            type="password"
                            placeholder="Confirm your password"
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            className="pl-10 h-12 bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {signupError && (
                        <Alert className="border-red-200 bg-red-50/80 dark:border-red-800 dark:bg-red-950/30 backdrop-blur-sm">
                          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <AlertDescription className="text-red-700 dark:text-red-400">
                            {signupError.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] font-medium"
                        disabled={isSignupLoading}
                      >
                        {isSignupLoading ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Creating account...
                          </div>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create Account
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
