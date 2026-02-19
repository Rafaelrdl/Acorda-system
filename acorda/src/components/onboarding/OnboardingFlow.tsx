import { useState, useCallback } from 'react'
import { WelcomeStep } from './steps/WelcomeStep'
import { GoalStep } from './steps/GoalStep'
import { HabitsStep } from './steps/HabitsStep'
import { GuidedTourStep } from './steps/GuidedTourStep'
import { ReadyStep } from './steps/ReadyStep'
import type { UserId, Goal, KeyResult, Habit } from '@/lib/types'
import { Progress } from '@/components/ui/progress'
import { User } from '@/lib/api'

export type OnboardingStep = 'welcome' | 'goal' | 'habits' | 'tour' | 'ready'

const STEPS: OnboardingStep[] = ['welcome', 'goal', 'habits', 'tour', 'ready']

interface OnboardingFlowProps {
  user: User
  userId: UserId
  onComplete: (data: OnboardingResult) => void
  onSkip: () => void
}

export interface OnboardingResult {
  goal?: Goal
  keyResults?: KeyResult[]
  habits: Habit[]
}

export function OnboardingFlow({ user, userId, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [collectedGoal, setCollectedGoal] = useState<Goal | undefined>()
  const [collectedKRs, setCollectedKRs] = useState<KeyResult[]>([])
  const [collectedHabits, setCollectedHabits] = useState<Habit[]>([])

  const currentIndex = STEPS.indexOf(currentStep)
  const progressPercent = ((currentIndex + 1) / STEPS.length) * 100

  const goNext = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex])
    }
  }, [currentIndex])

  const goBack = useCallback(() => {
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex])
    }
  }, [currentIndex])

  const handleGoalComplete = useCallback((goal: Goal, keyResults: KeyResult[]) => {
    setCollectedGoal(goal)
    setCollectedKRs(keyResults)
    goNext()
  }, [goNext])

  const handleHabitsComplete = useCallback((habits: Habit[]) => {
    setCollectedHabits(habits)
    goNext()
  }, [goNext])

  const handleFinish = useCallback(() => {
    onComplete({
      goal: collectedGoal,
      keyResults: collectedKRs,
      habits: collectedHabits,
    })
  }, [collectedGoal, collectedKRs, collectedHabits, onComplete])

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">
            Passo {currentIndex + 1} de {STEPS.length}
          </span>
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular setup
          </button>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {currentStep === 'welcome' && (
          <WelcomeStep
            userName={user.name || user.email.split('@')[0]}
            onNext={goNext}
          />
        )}

        {currentStep === 'goal' && (
          <GoalStep
            userId={userId}
            onComplete={handleGoalComplete}
            onSkip={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'habits' && (
          <HabitsStep
            userId={userId}
            onComplete={handleHabitsComplete}
            onSkip={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'tour' && (
          <GuidedTourStep
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 'ready' && (
          <ReadyStep
            goalCount={collectedGoal ? 1 : 0}
            habitCount={collectedHabits.length}
            onFinish={handleFinish}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  )
}
