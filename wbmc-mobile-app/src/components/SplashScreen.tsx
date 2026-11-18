import { useEffect, useState } from "react";
import echoLogo from "@/assets/echo-logo-splash.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
    const completeTimer = setTimeout(() => onComplete(), 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative animate-scale-in">
          {/* Pulsing rings */}
          <span className="absolute inset-0 rounded-full bg-primary-foreground/30 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-primary-foreground/20 animate-ping" style={{ animationDelay: '400ms' }} />
          <img
            src={echoLogo}
            alt="Echo"
            className="relative h-64 w-64 object-contain drop-shadow-2xl"
          />
        </div>
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-primary-foreground tracking-tight">
            Echo
          </h1>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Word Based Missional Church
          </p>
        </div>
        <div className="flex gap-1 mt-4">
          <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-primary-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
