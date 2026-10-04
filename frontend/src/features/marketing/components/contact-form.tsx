"use client";

import { useRef, useState, type FormEvent } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { ArrowRight, ChevronDown, MailCheck } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "../motion-tokens";
import { buttonStyles } from "./primitives/button-link";

const TOPICS = ["Sales and pricing", "A product question", "Help with my account", "Partnerships", "Something else"];

type Field = "name" | "email" | "company" | "topic" | "message";
type Values = Record<Field, string>;

const EMPTY: Values = { name: "", email: "", company: "", topic: TOPICS[0], message: "" };

function validate(values: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!values.name.trim()) errors.name = "Enter your name so we know who to reply to.";
  if (!values.email.trim()) errors.email = "Enter your email address so we can reply.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "That email address doesn't look complete — check for a missing @ or domain.";
  if (values.message.trim().length < 10) errors.message = "Tell us a little more — at least a sentence.";
  return errors;
}

const ORDER: Field[] = ["name", "email", "company", "topic", "message"];

/**
 * There's no contact endpoint on the backend, so the form composes an email in the visitor's own mail
 * app — and says so on the button — rather than pretending to send something.
 */
export function ContactForm() {
  const to = siteConfig.company.salesEmail || siteConfig.company.businessEmail;
  const [values, setValues] = useState<Values>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [opened, setOpened] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const errors = validate(values);
  const showError = (field: Field) => (touched[field] || submitted) && errors[field];

  const update = (field: Field) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));
  const blur = (field: Field) => () => setTouched((current) => ({ ...current, [field]: true }));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const firstInvalid = ORDER.find((field) => errors[field]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    const subject = `[${values.topic}] ${values.company.trim() || values.name.trim()}`;
    const signature = [values.name, values.company, values.email].map((part) => part.trim()).filter(Boolean);
    const body = `${values.message.trim()}\n\n—\n${signature.join("\n")}`;
    window.location.assign(`mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setOpened(true);
  };

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="rounded-[14px] border border-border bg-card p-6 sm:p-8">
      <p className="text-sm text-subtle">All fields are required unless marked optional.</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <TextField
          label="Your name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={update("name")}
          onBlur={blur("name")}
          error={showError("name")}
        />
        <TextField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={update("email")}
          onBlur={blur("email")}
          error={showError("email")}
        />
        <TextField
          label="Company"
          optional
          name="company"
          autoComplete="organization"
          value={values.company}
          onChange={update("company")}
          onBlur={blur("company")}
        />
        <div>
          <label htmlFor="contact-topic" className="text-sm font-medium text-foreground">
            What&apos;s it about?
          </label>
          <div className="relative mt-2">
            <select
              id="contact-topic"
              name="topic"
              value={values.topic}
              onChange={update("topic")}
              className={cn(fieldStyles, "cursor-pointer appearance-none pr-10")}
            >
              {TOPICS.map((topic) => (
                <option key={topic}>{topic}</option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-subtle" />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          value={values.message}
          onChange={update("message")}
          onBlur={blur("message")}
          aria-invalid={showError("message") ? true : undefined}
          aria-describedby={showError("message") ? "contact-message-error" : "contact-message-hint"}
          className={cn(fieldStyles, "mt-2 h-auto resize-y py-3 leading-relaxed")}
        />
        {showError("message") ? (
          <FieldError id="contact-message-error">{errors.message}</FieldError>
        ) : (
          <p id="contact-message-hint" className="mt-2 text-sm text-subtle">
            What you&apos;re selling, how many people would use it, anything we should know.
          </p>
        )}
      </div>

      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button type="submit" className={cn(buttonStyles({ size: "lg" }), "cursor-pointer")}>
          Continue in your email app
          <ArrowRight aria-hidden className="size-4 transition-transform duration-150 ease-ledger group-hover/btn:translate-x-0.5" />
        </button>
        <p className="text-sm text-subtle">Opens a ready-to-send email to {to}. Nothing is sent until you press send.</p>
      </div>

      <div role="status" aria-live="polite">
        <AnimatePresence>
          {opened && (
            <m.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.base, ease: EASE_OUT }}
              className="mt-6 flex gap-3 rounded-[10px] bg-positive-tint p-4 text-sm"
            >
              <MailCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" />
              <p className="text-foreground">
                Your email app should now be open with the message filled in. If nothing happened, write to{" "}
                <a href={`mailto:${to}`} className="font-medium text-link underline underline-offset-4">
                  {to}
                </a>{" "}
                directly.
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

// 48px tall and 16px text: comfortable to tap, and iOS won't zoom the page on focus
const fieldStyles = cn(
  "block h-12 w-full rounded-[10px] border border-input bg-card px-3.5 text-base text-foreground",
  "transition-[border-color,box-shadow] duration-150 hover:border-rule-strong",
  "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/20",
  "aria-[invalid=true]:border-negative aria-[invalid=true]:focus-visible:ring-negative/20"
);

interface TextFieldProps {
  label: string;
  name: Field;
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  onBlur: () => void;
  error?: string | false;
  optional?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "text";
}

function TextField({ label, name, error, optional, type = "text", ...input }: TextFieldProps) {
  const id = `contact-${name}`;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {optional && <span className="font-normal text-subtle"> (optional)</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(fieldStyles, "mt-2")}
        {...input}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: string | undefined }) {
  return (
    <p id={id} className="mt-2 text-sm text-negative">
      {children}
    </p>
  );
}
