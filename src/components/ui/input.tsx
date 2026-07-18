import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
}

/**
 * The `error` message is rendered, not just used to colour the border.
 *
 * It previously only tinted the border, so a failed validation communicated
 * "something here is wrong" and nothing more — and communicated even that only
 * to people who can see the colour. Screen readers announced nothing, since
 * there was no aria-invalid and no message to point at. Every form in the app
 * passes this prop, so all of them were affected.
 */
function Input({
  className,
  type,
  error,
  id,
  "aria-describedby": describedBy,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const errorId = error ? `${id ?? generatedId}-error` : undefined;

  const input = (
    <input
      type={type}
      id={id}
      data-slot="input"
      aria-invalid={error ? true : props["aria-invalid"]}
      // Keeps any caller-supplied description rather than replacing it.
      aria-describedby={[describedBy, errorId].filter(Boolean).join(" ") || undefined}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        error && "border-destructive focus-visible:ring-destructive/50",
        className
      )}
      {...props}
    />
  );

  // Returned bare when valid, so the markup is identical to before for every
  // existing caller — including those that place this directly in a flex row,
  // which an unconditional wrapper would re-lay-out.
  if (!error) return input;

  return (
    <div className="w-full">
      {input}
      <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">
        {error}
      </p>
    </div>
  );
}

export { Input }
