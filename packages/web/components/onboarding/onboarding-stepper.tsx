import { Icon } from '@/components/ui/icon';

/**
 * Horizontal numbered stepper (DESIGN.md §4.2 STEPPER). `current` is the zero-based
 * index of the active step; earlier steps render done (accent fill + check), later
 * steps render pending. Styling lives in the `.stepper*` classes in globals.css.
 */
export function OnboardingStepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="stepper" role="list" aria-label="Onboarding progress">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'pending';
        return (
          <div
            key={label}
            className={`stepper-step ${state}`}
            role="listitem"
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className="stepper-node">
              {state === 'done' ? <Icon name="check" size={15} /> : i + 1}
            </span>
            <span className="stepper-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
