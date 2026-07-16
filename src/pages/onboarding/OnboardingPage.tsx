import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { learningApi } from '@/api/user.api';
import { useAuthStore } from '@/store/authStore';
import { Brain, Code2, Layers, Briefcase, Zap, Loader2, Search, Target } from 'lucide-react';
import { cn } from '@/lib/cn';

const ROLES = [
  { id: 'FRONTEND_DEVELOPER', label: 'Frontend Engineer', icon: Code2, color: 'text-blue-400' },
  { id: 'BACKEND_DEVELOPER', label: 'Backend Engineer', icon: Layers, color: 'text-green-400' },
  { id: 'FULLSTACK_DEVELOPER', label: 'Fullstack Engineer', icon: Zap, color: 'text-purple-400' },
  { id: 'DSA_SPECIALIST', label: 'DSA Specialist', icon: Brain, color: 'text-orange-400' },
];

const LEVELS = [
  { id: 'BEGINNER', label: 'Beginner' },
  { id: 'INTERMEDIATE', label: 'Intermediate' },
  { id: 'ADVANCED', label: 'Advanced' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, initFromStorage } = useAuthStore();
  const [step, setStep] = useState(1);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const [formData, setFormData] = useState({
    targetRole: '',
    currentLevel: '',
    targetCompanies: '',
    weaknesses: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent accessing if already onboarded
  useEffect(() => {
    if (user?.hasOnboarded) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await learningApi.generatePath(formData);
      
      // Update local storage user object
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.hasOnboarded = true;
        localStorage.setItem('auth_user', JSON.stringify(parsed));
        // Force zustand to reload from storage to instantly reflect changes
        initFromStorage();
      }

      setIsGenerating(false);
      setShowConfetti(true);
      
      setTimeout(() => {
        navigate('/learning');
      }, 4000);
    } catch (error) {
      console.error('Failed to generate learning path', error);
      setIsGenerating(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.targetRole && formData.currentLevel;
    if (step === 2) return true; // Target companies optional
    if (step === 3) return true; // Weaknesses optional
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />}

      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto p-6 justify-center z-10 relative">
        
        {/* Header / Logo */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/20 p-2 border border-primary/30">
              <Brain className="size-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">Antigravity</span>
          </div>
        </div>

        <div className="bg-card border border-border shadow-2xl rounded-2xl p-8 min-h-[400px] relative overflow-hidden">
          
          {isGenerating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full space-y-6 text-center mt-12"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Analyzing your profile...</h3>
                <p className="text-muted-foreground animate-pulse">
                  Gemini is building your hyper-personalized curriculum.
                </p>
              </div>
            </motion.div>
          ) : showConfetti ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center h-full space-y-6 text-center mt-12"
            >
              <div className="rounded-full bg-green-500/20 p-4 border border-green-500/30">
                <Target className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">You're all set!</h3>
                <p className="text-muted-foreground">Redirecting to your new learning path...</p>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome to Antigravity</h2>
                    <p className="text-muted-foreground">Let's tailor your experience. What role are you targeting?</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {ROLES.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setFormData({ ...formData, targetRole: role.id })}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200",
                          formData.targetRole === role.id 
                            ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                            : "border-border bg-background hover:border-primary/50 hover:bg-secondary"
                        )}
                      >
                        <role.icon className={cn("w-8 h-8 mb-3", role.color)} />
                        <span className="font-semibold text-sm">{role.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground text-center">What is your current experience level?</p>
                    <div className="flex gap-3 justify-center">
                      {LEVELS.map((level) => (
                        <button
                          key={level.id}
                          onClick={() => setFormData({ ...formData, currentLevel: level.id })}
                          className={cn(
                            "px-6 py-2.5 rounded-full border text-sm font-medium transition-all",
                            formData.currentLevel === level.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-secondary"
                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                      <Briefcase className="w-6 h-6 text-blue-500" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Target Companies</h2>
                    <p className="text-muted-foreground">Are there specific companies you want to join? (Optional)</p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        value={formData.targetCompanies}
                        onChange={(e) => setFormData({ ...formData, targetCompanies: e.target.value })}
                        placeholder="e.g. Google, Stripe, Meta"
                        className="pl-10 py-6 text-lg bg-background"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      We will prioritize questions frequently asked by these companies.
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
                      <Target className="w-6 h-6 text-orange-500" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Identify Weaknesses</h2>
                    <p className="text-muted-foreground">What topics do you struggle with the most? (Optional)</p>
                  </div>

                  <div className="space-y-4 max-w-md mx-auto">
                    <Input 
                      value={formData.weaknesses}
                      onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                      placeholder="e.g. Dynamic Programming, System Design, React Hooks"
                      className="py-6 text-lg bg-background"
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Our spaced repetition engine will focus heavily on these areas.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Footer Navigation */}
          {!isGenerating && !showConfetti && (
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
              {step > 1 ? (
                <Button variant="ghost" onClick={handleBack}>Back</Button>
              ) : (
                <div />
              )}
              
              {step < 3 ? (
                <Button onClick={handleNext} disabled={!isStepValid()}>
                  Continue
                </Button>
              ) : (
                <Button variant="gradient" onClick={handleGenerate}>
                  Generate Curriculum
                </Button>
              )}
            </div>
          )}

        </div>
        
        {/* Progress dots */}
        {!isGenerating && !showConfetti && (
          <div className="flex justify-center gap-2 mt-8">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  step === i ? "w-8 bg-primary" : "w-2 bg-border"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
