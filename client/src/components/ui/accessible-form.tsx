import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { a11yUtils } from "@/lib/accessibility";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Info } from "lucide-react";

// Base accessible form field wrapper
interface AccessibleFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleField({ 
  label, 
  required = false, 
  error, 
  helpText, 
  children, 
  className 
}: AccessibleFieldProps) {
  const fieldId = useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = helpText ? `${fieldId}-help` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={fieldId}
        className={cn("block text-sm font-medium", {
          "after:content-['*'] after:ml-1 after:text-destructive": required
        })}
      >
        {label}
      </Label>
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-invalid': error ? 'true' : 'false',
          'aria-describedby': cn(helpId, errorId).trim() || undefined,
          className: cn(
            (children as React.ReactElement).props.className,
            error && "border-destructive focus:border-destructive"
          )
        })}
        
        {error && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
          </div>
        )}
      </div>

      {helpText && (
        <p id={helpId} className="text-sm text-muted-foreground flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-destructive flex items-start gap-1" role="alert">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible Input
export interface AccessibleInputProps 
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ label, required, error, helpText, className, ...props }, ref) => {
    return (
      <AccessibleField 
        label={label} 
        required={required} 
        error={error} 
        helpText={helpText}
        className={className}
      >
        <Input 
          ref={ref} 
          {...props}
          aria-required={required}
        />
      </AccessibleField>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

// Accessible Textarea
export interface AccessibleTextareaProps 
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ label, required, error, helpText, className, ...props }, ref) => {
    return (
      <AccessibleField 
        label={label} 
        required={required} 
        error={error} 
        helpText={helpText}
        className={className}
      >
        <Textarea 
          ref={ref} 
          {...props}
          aria-required={required}
        />
      </AccessibleField>
    );
  }
);

AccessibleTextarea.displayName = "AccessibleTextarea";

// Accessible Select
export interface AccessibleSelectProps {
  label: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function AccessibleSelect({
  label,
  value,
  onValueChange,
  placeholder,
  required,
  error,
  helpText,
  children,
  className,
  disabled
}: AccessibleSelectProps) {
  const fieldId = useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = helpText ? `${fieldId}-help` : undefined;

  return (
    <AccessibleField 
      label={label} 
      required={required} 
      error={error} 
      helpText={helpText}
      className={className}
    >
      <Select 
        value={value} 
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={fieldId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(helpId, errorId).trim() || undefined}
          aria-required={required}
          className={cn(error && "border-destructive focus:border-destructive")}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </AccessibleField>
  );
}

// Accessible Checkbox
export interface AccessibleCheckboxProps {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  disabled?: boolean;
}

export function AccessibleCheckbox({
  label,
  checked,
  onCheckedChange,
  required,
  error,
  helpText,
  className,
  disabled
}: AccessibleCheckboxProps) {
  const fieldId = useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = helpText ? `${fieldId}-help` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start space-x-2">
        <input
          id={fieldId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={cn(helpId, errorId).trim() || undefined}
          aria-required={required}
          className={cn(
            "mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary",
            error && "border-destructive"
          )}
        />
        <Label 
          htmlFor={fieldId}
          className={cn("text-sm font-medium cursor-pointer", {
            "after:content-['*'] after:ml-1 after:text-destructive": required
          })}
        >
          {label}
        </Label>
      </div>

      {helpText && (
        <p id={helpId} className="text-sm text-muted-foreground flex items-start gap-1 ml-6">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-destructive flex items-start gap-1 ml-6" role="alert">
          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// Form section with accessible heading
export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  const titleId = useId();
  
  return (
    <fieldset className={cn("space-y-4", className)} aria-labelledby={titleId}>
      <legend id={titleId} className="text-lg font-semibold">
        {title}
      </legend>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  );
}

// Error summary component for forms
export interface ErrorSummaryProps {
  errors: Array<{ field: string; message: string }>;
  className?: string;
}

export function ErrorSummary({ errors, className }: ErrorSummaryProps) {
  if (errors.length === 0) return null;

  return (
    <div 
      className={cn(
        "rounded-md border border-destructive bg-destructive/10 p-4",
        className
      )}
      role="alert"
      aria-label="Form errors"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-medium text-destructive">
            There {errors.length === 1 ? 'is' : 'are'} {errors.length} error{errors.length === 1 ? '' : 's'} with your submission
          </h3>
          <ul className="mt-2 text-sm text-destructive list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>
                <strong>{error.field}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}