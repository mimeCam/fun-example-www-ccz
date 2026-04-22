/**
 * Field — the thermal-aware listening surface.
 *
 * The one input voice for the site. The reader "speaks back" here: caret
 * carries --token-accent, border crossfades 120 ms on focus, nothing else
 * moves during keystrokes. The room leans in; it does not light up.
 *
 * Scope knife (Tanya §6 / Mike §4.5):
 *   • Two variants: `text` (input) and `multiline` (textarea). Locked pair.
 *   • No `asChild` — an input is always an input. No Slot plumbing.
 *   • No `leftIcon`, `rightIcon`, `autoGrow`, `outlined` — add when a real
 *     caller shows up. Out-of-scope items are caught by adoption test.
 *
 * Helper row — "one row, one voice" (Tanya §5a):
 *   • `error` (string) wins over `helperText`; counter defaults to
 *     `${value.length}/${maxLength}` when `counter` is on.
 *   • Counter and error are never stacked. Submit button never shifts when
 *     an error arrives — that is the polish this sprint buys.
 *
 * Credits: Mike K. (napkin §3.1), Tanya D. (visual spec §3 + motion §4 +
 * layout advocacy §5), Paul K. (held-beat error semantics, binary metric),
 * Elon M. (scope cuts — no sibling hush, no trinity rhetoric),
 * Jason F. (caret = thermal accent), Krystle C. (single migration target).
 */

'use client';

import {
  forwardRef, useId,
  type ChangeEvent, type CSSProperties, type FocusEvent,
} from 'react';
import {
  type FieldVariant, type FieldSize,
  composeFieldClass, resolveFieldStyle,
} from '@/lib/utils/field-phase';
import { useFieldPhase } from '@/lib/hooks/useFieldPhase';

// ─── Public API ────────────────────────────────────────────────────────────

export type { FieldVariant, FieldSize };

type AnyFieldElement = HTMLInputElement | HTMLTextAreaElement;

/** Change/Focus handlers use the union so callers don't fork on variant. */
export type FieldChangeEvent = ChangeEvent<AnyFieldElement>;
export type FieldFocusEvent = FocusEvent<AnyFieldElement>;

/**
 * Public props — hand-picked so both `<input>` and `<textarea>` legs share
 * one signature. Anything we don't list is either handled by the primitive
 * (label, helper, counter, error) or deliberately kept off the API (Tanya §6).
 */
export interface FieldProps {
  variant?: FieldVariant;
  size?: FieldSize;
  /** Label text. Always rendered so htmlFor-wiring cannot drift. */
  label: string;
  /** Ambient hint — e.g. "Markdown not supported". Suppressed when `error` set. */
  helperText?: string;
  /** Held-beat error message. Takes over the helper row for FIELD_ERROR_HOLD_MS. */
  error?: string | null;
  /** Show built-in `n/maxLength` counter in the helper row. Default false. */
  counter?: boolean;
  /** Extra id(s) for aria-describedby composition. */
  describedBy?: string;
  /** Extra className appended after the variant recipe. */
  className?: string;
  /** Inline styles merged after the phase-machine border swap. */
  style?: CSSProperties;
  /** Rows — textarea only. Ignored when variant==='text'. Default 4. */
  rows?: number;

  /* Native passthroughs — the subset that makes sense for every Field. */
  id?: string;
  name?: string;
  value?: string | number | readonly string[];
  defaultValue?: string | number | readonly string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  onChange?: (e: FieldChangeEvent) => void;
  onFocus?: (e: FieldFocusEvent) => void;
  onBlur?: (e: FieldFocusEvent) => void;
}

// ─── The component ────────────────────────────────────────────────────────


export const Field = forwardRef<AnyFieldElement, FieldProps>(
  function Field(props, ref) {
    const { phase, reduced, handlers } = useFieldPhase(Boolean(props.error));
    const id = useFieldId(props.id);
    const helperId = `${id}-helper`;
    const klass = composeClassFor(props);
    const style = { ...resolveFieldStyle(phase, reduced), ...props.style };
    const describedBy = combineDescribedBy(props, helperId);
    const wiring = { id, ref, handlers, klass, style, describedBy };
    return renderField(props, wiring);
  },
);

// ─── Render split — keeps each leg trivially short ────────────────────────

interface Wiring {
  id: string;
  ref: React.ForwardedRef<AnyFieldElement>;
  handlers: ReturnType<typeof useFieldPhase>['handlers'];
  klass: string;
  style: CSSProperties | undefined;
  describedBy: string | undefined;
}

function renderField(props: FieldProps, w: Wiring): JSX.Element {
  return (
    <div>
      <Label htmlFor={w.id} text={props.label} />
      {props.variant === 'multiline'
        ? renderTextarea(props, w)
        : renderInput(props, w)}
      <HelperRow value={props.value} {...pickHelperProps(props)} id={`${w.id}-helper`} />
    </div>
  );
}

function renderInput(props: FieldProps, w: Wiring): JSX.Element {
  const native = nativeAttrs(props, w);
  return (
    <input
      {...native}
      type="text"
      ref={w.ref as React.ForwardedRef<HTMLInputElement>}
      onChange={props.onChange as React.ChangeEventHandler<HTMLInputElement>}
      onFocus={chainFocus(props.onFocus, w.handlers.onFocus) as React.FocusEventHandler<HTMLInputElement>}
      onBlur={chainFocus(props.onBlur, w.handlers.onBlur) as React.FocusEventHandler<HTMLInputElement>}
    />
  );
}

function renderTextarea(props: FieldProps, w: Wiring): JSX.Element {
  const native = nativeAttrs(props, w);
  return (
    <textarea
      {...native}
      rows={props.rows ?? 4}
      ref={w.ref as React.ForwardedRef<HTMLTextAreaElement>}
      onChange={props.onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
      onFocus={chainFocus(props.onFocus, w.handlers.onFocus) as React.FocusEventHandler<HTMLTextAreaElement>}
      onBlur={chainFocus(props.onBlur, w.handlers.onBlur) as React.FocusEventHandler<HTMLTextAreaElement>}
    />
  );
}

/** The narrow, cast-free subset that is safe to spread onto either element. */
function nativeAttrs(props: FieldProps, w: Wiring) {
  return {
    id: w.id,
    name: props.name,
    value: props.value,
    defaultValue: props.defaultValue,
    placeholder: props.placeholder,
    required: props.required,
    disabled: props.disabled,
    readOnly: props.readOnly,
    autoFocus: props.autoFocus,
    autoComplete: props.autoComplete,
    maxLength: props.maxLength,
    minLength: props.minLength,
    className: w.klass,
    style: w.style,
    'aria-invalid': Boolean(props.error) || undefined,
    'aria-describedby': w.describedBy,
  };
}

// ─── Sub-pieces — Label + HelperRow ───────────────────────────────────────

function Label({ htmlFor, text }: { htmlFor: string; text: string }): JSX.Element {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sys-caption font-sys-accent text-foreground/80 mb-sys-3"
    >
      {text}
    </label>
  );
}

interface HelperProps {
  id: string;
  value: FieldProps['value'];
  helperText?: string;
  error?: string | null;
  counter?: boolean;
  maxLength?: number;
}

function HelperRow(p: HelperProps): JSX.Element | null {
  const content = resolveHelperContent(p);
  if (!content) return null;
  return (
    <div
      id={p.id}
      className={`flex justify-between mt-sys-1 text-sys-micro ${p.error ? 'text-rose' : 'text-mist'}`}
      aria-live={p.error ? 'polite' : undefined}
      role={p.error ? 'alert' : undefined}
    >
      <span>{content.text}</span>
      {content.count && <span>{content.count}</span>}
    </div>
  );
}

// ─── Pure helpers (≤ 10 LOC each) ─────────────────────────────────────────

interface HelperContent {
  text: string;
  count: string | null;
}

function resolveHelperContent(p: HelperProps): HelperContent | null {
  const count = p.counter && p.maxLength ? charCount(p.value, p.maxLength) : null;
  if (p.error) return { text: p.error, count };
  if (p.helperText) return { text: p.helperText, count };
  if (count) return { text: '', count };
  return null;
}

function charCount(value: FieldProps['value'], max: number): string {
  const n = typeof value === 'string' ? value.length : 0;
  return `${n}/${max}`;
}

function composeClassFor(props: FieldProps): string {
  return composeFieldClass({
    variant: props.variant ?? 'text',
    size: props.size ?? 'md',
    disabled: Boolean(props.disabled),
    invalid: Boolean(props.error),
    extra: props.className,
  });
}

function combineDescribedBy(props: FieldProps, helperId: string): string | undefined {
  const parts = [props.describedBy, (props.error || props.helperText || props.counter) ? helperId : undefined];
  const joined = parts.filter(Boolean).join(' ');
  return joined || undefined;
}

function useFieldId(explicit: string | undefined): string {
  const generated = useId();
  return explicit ?? `field-${generated.replace(/:/g, '')}`;
}

function pickHelperProps(p: FieldProps): Omit<HelperProps, 'id' | 'value'> {
  return {
    helperText: p.helperText,
    error: p.error,
    counter: p.counter,
    maxLength: p.maxLength,
  };
}

function chainFocus(
  a?: (e: FocusEvent<AnyFieldElement>) => void,
  b?: (e: FocusEvent<AnyFieldElement>) => void,
): ((e: FocusEvent<AnyFieldElement>) => void) | undefined {
  if (!a && !b) return undefined;
  return (e) => { a?.(e); b?.(e); };
}
