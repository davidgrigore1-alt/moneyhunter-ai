import { Button as BaseButton, type ButtonProps } from "./Button";
import controls from "./PremiumControls.module.css";

/** Explicit product adoption; marketing and the base Button remain unchanged. */
export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const material = variant === "primary" || variant === "intelligence" ? controls.primary : variant === "secondary" ? controls.secondary : "";
  return <BaseButton {...props} variant={variant} className={`${material} ${className ?? ""}`} />;
}
