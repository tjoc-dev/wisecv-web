import { forwardRef, useImperativeHandle, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { cn } from '@/lib/utils';

export interface CaptchaRef {
  reset: () => void;
  getValue: () => string | null;
}

interface CaptchaProps {
  siteKey: string;
  onChange?: (token: string | null) => void;
  onExpired?: () => void;
  onError?: () => void;
  theme?: 'light' | 'dark';
  size?: 'compact' | 'normal';
  className?: string;
}

export const Captcha = forwardRef<CaptchaRef, CaptchaProps>(
  ({ siteKey, onChange, onExpired, onError, theme = 'light', size = 'normal', className }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset();
      },
      getValue: () => {
        return recaptchaRef.current?.getValue() || null;
      },
    }));

    return (
      <div className={cn('flex justify-center', className)}>
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={onChange}
          onExpired={onExpired}
          onError={onError}
          theme={theme}
          size={size}
        />
      </div>
    );
  }
);

Captcha.displayName = 'Captcha';