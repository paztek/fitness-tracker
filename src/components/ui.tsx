import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from './icons';

/* ------------------------------------------------------------------ sheet */

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

/** Panneau modal glissant depuis le bas, façon application native. */
export function Sheet({ open, title, onClose, children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="overlay"
      onPointerDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="sheet">
        <div className="grabber" />
        <div className="sheet-header">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Fermer">
            <Icon name="x" />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  danger,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <Sheet
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn" onClick={onCancel}>
            Annuler
          </button>
          <button
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="muted">{message}</p>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ toast */

type ToastKind = 'info' | 'danger';
type ToastFn = (message: string, kind?: ToastKind) => void;

const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback<ToastFn>((message, kind = 'info') => {
    setToast({ message, kind });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast &&
        createPortal(
          <div className={`toast ${toast.kind === 'danger' ? 'danger' : ''}`} role="status">
            {toast.message}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  return useContext(ToastContext);
}

/* ------------------------------------------------------------- formulaires */

interface NumberFieldProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  ariaLabel?: string;
  withButtons?: boolean;
  className?: string;
}

/** Saisie numérique tactile : champ décimal + boutons d'incrément. */
export function NumberField({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  placeholder,
  ariaLabel,
  withButtons = true,
  className = '',
}: NumberFieldProps) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(value === undefined ? '' : String(value));
  }, [value]);

  const commit = (raw: string) => {
    setText(raw);
    const cleaned = raw.replace(',', '.').trim();
    if (cleaned === '') return onChange(undefined);
    const parsed = Number(cleaned);
    if (!Number.isNaN(parsed)) onChange(parsed);
  };

  const bump = (delta: number) => {
    const base = value ?? 0;
    let next = Math.round((base + delta) * 1000) / 1000;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    setText(String(next));
    onChange(next);
  };

  return (
    <div className={`stepper ${className}`}>
      {withButtons && (
        <button
          type="button"
          className="btn-icon small"
          onClick={() => bump(-step)}
          aria-label="Diminuer"
        >
          <Icon name="minus" size={16} />
        </button>
      )}
      <input
        className="input grow"
        type="text"
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onFocus={(e) => {
          focused.current = true;
          e.currentTarget.select();
        }}
        onBlur={() => {
          focused.current = false;
          setText(value === undefined ? '' : String(value));
        }}
        onChange={(e) => commit(e.target.value)}
      />
      {withButtons && (
        <button
          type="button"
          className="btn-icon small"
          onClick={() => bump(step)}
          aria-label="Augmenter"
        >
          <Icon name="plus" size={16} />
        </button>
      )}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className={option.value === value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SwitchRowProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SwitchRow({ label, hint, checked, onChange }: SwitchRowProps) {
  return (
    <label className="switch">
      <span className="grow">
        <span className="strong">{label}</span>
        {hint && <span className="tiny muted" style={{ display: 'block' }}>{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder, autoFocus }: SearchInputProps) {
  return (
    <div className="search">
      <Icon name="search" size={18} />
      <input
        className="input"
        type="search"
        value={value}
        placeholder={placeholder ?? 'Rechercher…'}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        enterKeyHint="search"
      />
      {value && (
        <button
          className="btn-icon small clear"
          onClick={() => onChange('')}
          aria-label="Effacer"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon = 'info',
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Icon name={icon} size={40} />
      <div>
        <div className="strong">{title}</div>
        {message && <div className="small">{message}</div>}
      </div>
      {action}
    </div>
  );
}

/** Chip de filtre, sélectionnable. */
export function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`chip ${selected ? 'selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

/** Liste virtualisée minimale : n'affiche qu'une fenêtre croissante. */
export function useIncrementalList<T>(items: T[], step = 40) {
  const [count, setCount] = useState(step);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => setCount(step), [items, step]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setCount((c) => (c < items.length ? c + step : c));
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length, step]);

  const visible = useMemo(() => items.slice(0, count), [items, count]);
  return { visible, sentinel, hasMore: count < items.length };
}
