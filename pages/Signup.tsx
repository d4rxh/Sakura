import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { usePlayerStore } from '../store/playerStore';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginUser } = usePlayerStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authService.signup(name, email.toLowerCase().trim(), password);
      loginUser(user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
      setLoading(true);
      setError('');
      try {
          const user = await authService.loginWithGoogle();
          loginUser(user);
          navigate('/');
      } catch (err: any) {
          setError(err.message || 'Google Signup failed.');
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-center p-4" style={{background:"linear-gradient(160deg,#0A000F 0%,#1E0030 50%,#0A000F 100%)"}}> 
      
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-2">
           <div className="flex items-center gap-2.5">
             <svg width="40" height="40" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
               <defs>
                 <linearGradient id="signupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#FF6B9D"/>
                   <stop offset="100%" stopColor="#C2185B"/>
                 </linearGradient>
               </defs>
               <rect width="512" height="512" rx="115" fill="url(#signupGrad)"/>
               <g transform="translate(256,256)">
                 <ellipse rx="42" ry="75" fill="white" opacity="0.95" transform="rotate(0) translate(0,-78)"/>
                 <ellipse rx="42" ry="75" fill="white" opacity="0.95" transform="rotate(72) translate(0,-78)"/>
                 <ellipse rx="42" ry="75" fill="white" opacity="0.95" transform="rotate(144) translate(0,-78)"/>
                 <ellipse rx="42" ry="75" fill="white" opacity="0.95" transform="rotate(216) translate(0,-78)"/>
                 <ellipse rx="42" ry="75" fill="white" opacity="0.95" transform="rotate(288) translate(0,-78)"/>
                 <circle r="30" fill="#FFB7C5"/>
                 <polygon points="-12,-18 -12,18 22,0" fill="#8B0045" opacity="0.9"/>
               </g>
             </svg>
             <div className="flex flex-col leading-none">
               <span className="text-white font-bold text-lg tracking-wide">Kawai Sakura</span>
               <span className="text-[#FF6B9D] text-[10px] tracking-widest opacity-80">さくら音楽</span>
             </div>
           </div>
           <h1 className="text-3xl font-bold text-center tracking-tighter">Sign up to start listening</h1>
        </div>

        {error && (
             <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded text-sm text-center">
               {error}
             </div>
        )}

        {/* Social Signup */}
        <div className="flex flex-col gap-2">
            <button 
                onClick={handleGoogleSignup}
                disabled={loading}
                className="flex items-center justify-center gap-4 w-full bg-transparent border border-[#FF6B9D]/30 hover:border-[#FF6B9D] text-white font-bold py-3 rounded-full transition-all"
            >
                <svg width="24" height="24" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                <span>Sign up with Google</span>
            </button>
        </div>

        <div className="flex items-center gap-4 my-2">
            <div className="h-[1px] bg-[#292929] flex-1"></div>
            <span className="text-sm font-bold text-white/50">OR</span>
            <div className="h-[1px] bg-[#292929] flex-1"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
           
           <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">What's your email?</label>
              <input 
                type="email" 
                required
                className="bg-[#1A0025] border border-[#FF6B9D]/30 rounded p-3 focus:outline-none focus:border-[#FF6B9D] transition-colors"
                placeholder="name@domain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Create a password</label>
              <input 
                type="password" 
                required
                className="bg-[#1A0025] border border-[#FF6B9D]/30 rounded p-3 focus:outline-none focus:border-[#FF6B9D] transition-colors"
                placeholder="Create a password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
           </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">What should we call you?</label>
              <input 
                type="text" 
                required
                className="bg-[#1A0025] border border-[#FF6B9D]/30 rounded p-3 focus:outline-none focus:border-[#FF6B9D] transition-colors"
                placeholder="Enter a profile name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <span className="text-xs text-[#B3B3B3]">This appears on your profile.</span>
           </div>

           <button 
              type="submit" 
              disabled={loading}
              className="font-bold py-3 rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 flex items-center justify-center uppercase tracking-widest text-sm text-white" style={{background:"linear-gradient(135deg,#FF6B9D,#C2185B)"}}
           >
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign Up'}
           </button>
        </form>

        <div className="h-[1px] bg-[#292929] w-full"></div>

        <div className="text-center text-[#B3B3B3]">
           Have an account? <Link to="/login" className="text-white hover:underline font-bold">Log in</Link>
        </div>

        <button onClick={() => navigate('/')} className="text-sm text-[#B3B3B3] hover:text-white flex items-center justify-center gap-1">
             <ArrowLeft size={14} /> Back to Web Player
        </button>
      </div>
    </div>
  );
};