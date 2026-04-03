"use client";

import { useState, useCallback, useEffect } from "react";

interface WalkthroughStep {
  title: string;
  description: string;
  targetTab?: string;
}

const STEPS: WalkthroughStep[] = [
  {
    title: "Welcome to your portal!",
    description:
      "Let's take a quick tour of everything you have access to.",
  },
  {
    title: "Home",
    description:
      "This is your Home base. You'll see content that needs your review, your content pipeline at a glance, and upcoming shoot and publish dates.",
    targetTab: "home",
  },
  {
    title: "Content Tracker",
    description:
      "Your Content Tracker shows every piece of content we're working on for you. Each card moves through stages from Idea to Published. You can click any card to see details.",
    targetTab: "kanban",
  },
  {
    title: "Calendar",
    description:
      "The Calendar gives you a visual view of your content schedule. See what's coming up and when things are due.",
    targetTab: "calendar",
  },
  {
    title: "Messages",
    description:
      "Messages is where you communicate with your team. Send text or voice messages, use threads to keep conversations organized.",
    targetTab: "messages",
  },
  {
    title: "Files",
    description:
      "Connect your Google Drive to browse and share files directly in the portal.",
    targetTab: "files",
  },
  {
    title: "Resources",
    description:
      "Your team will upload guides, templates, and brand assets here for easy reference.",
    targetTab: "resources",
  },
  {
    title: "Analytics",
    description:
      "Track your content performance with detailed analytics and insights.",
    targetTab: "analytics",
  },
  {
    title: "Profile",
    description:
      "Your Profile has your account settings, billing information, and the intake form you just completed.",
    targetTab: "profile",
  },
  {
    title: "You're all set!",
    description:
      "Start by checking your Home tab, or message your team to say hello.",
  },
];

interface Props {
  onComplete: () => void;
  onStepChange?: (tabId: string) => void;
}

export function OnboardingWalkthrough({ onComplete, onStepChange }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;
  const totalSteps = STEPS.length;

  const animateTransition = useCallback(
    (nextIndex: number) => {
      setFading(true);
      setTimeout(() => {
        setCurrentStep(nextIndex);
        const nextStep = STEPS[nextIndex];
        if (nextStep.targetTab && onStepChange) {
          onStepChange(nextStep.targetTab);
        }
        setFading(false);
      }, 200);
    },
    [onStepChange]
  );

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    animateTransition(currentStep + 1);
  }, [currentStep, isLast, onComplete, animateTransition]);

  const handleBack = useCallback(() => {
    if (isFirst) return;
    animateTransition(currentStep - 1);
  }, [currentStep, isFirst, animateTransition]);

  const handleClose = useCallback(() => {
    setVisible(false);
    onComplete();
  }, [onComplete]);

  /* Navigate to the first targetTab on mount */
  useEffect(() => {
    if (step.targetTab && onStepChange) {
      onStepChange(step.targetTab);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={handleClose}
      />

      {/* Tooltip card */}
      <div
        className={`relative z-10 w-[90vw] max-w-md mx-4 rounded-xl border border-border bg-surface p-6 shadow-2xl transition-opacity duration-200 ${
          fading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-text-3 hover:text-text hover:bg-surface-2 transition-colors"
          aria-label="Close walkthrough"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="4" x2="12" y2="12" />
            <line x1="12" y1="4" x2="4" y2="12" />
          </svg>
        </button>

        {/* Step counter */}
        <div className="text-xs text-text-3 mb-1">
          {currentStep + 1} of {totalSteps}
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-text mb-2">{step.title}</h2>

        {/* Description */}
        <p className="text-sm text-text-2 leading-relaxed mb-6">
          {step.description}
        </p>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {!isFirst && (
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm rounded-lg border border-border text-text-2 hover:text-text hover:bg-surface-2 transition-colors"
            >
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-red text-white hover:opacity-90 transition-opacity"
          >
            {isLast ? "Get Started" : "Next"}
          </button>
        </div>

        {/* Skip tour */}
        {!isLast && (
          <button
            onClick={handleClose}
            className="mt-4 text-xs text-text-3 hover:text-text-2 transition-colors"
          >
            Skip Tour
          </button>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === currentStep
                  ? "w-4 bg-red"
                  : i < currentStep
                  ? "w-1.5 bg-text-3"
                  : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
