"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { logIn, signUp } from "@/lib/auth";

type Mode = "login" | "signup";
type Field = "name" | "email" | "password";
type Errors = Partial<Record<Field, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function validate(mode: Mode, values: Record<Field, string>): Errors {
  const errors: Errors = {};
  if (mode === "signup" && !values.name.trim()) errors.name = "이름을 입력해 주세요.";
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "올바른 이메일 주소를 입력해 주세요.";
  if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 해요.`;
  }
  return errors;
}

type InputFieldProps = {
  id: Field;
  label: string;
  type: string;
  value: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  onChange: (value: string) => void;
  trailing?: React.ReactNode;
};

function InputField({ id, label, type, value, placeholder, autoComplete, error, onChange, trailing }: InputFieldProps) {
  return (
    <div className="flex w-full flex-col items-start gap-[8px]">
      <label htmlFor={id} className="text-[11px] leading-[16px] font-bold text-text-primary">
        {label}
      </label>
      <div
        className={`flex h-[52px] w-full items-center gap-[10px] rounded-12 border bg-surface px-[16px] ${
          error ? "border-status-red" : "border-line focus-within:border-brand-purple"
        }`}
      >
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[13px] leading-[20px] text-text-primary outline-none placeholder:text-text-muted"
        />
        {trailing}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-[10px] leading-[15px] text-status-red">
          {error}
        </p>
      )}
    </div>
  );
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const update = (field: Field) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(mode, values);
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      if (isSignup) {
        if ((await signUp(values)) === "exists") {
          setErrors({ email: "이미 가입된 이메일이에요. 로그인해 주세요." });
          return;
        }
      } else if (!(await logIn(values))) {
        setFormError("이메일 또는 비밀번호가 맞지 않아요.");
        return;
      }
      router.push("/");
    } catch {
      setFormError("이 브라우저에서는 로그인 정보를 저장할 수 없어요. 저장 공간 설정을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-start gap-[6px]">
        <p className="font-manrope text-[10px] leading-[16px] font-bold text-brand-purple">{isSignup ? "SIGN UP" : "LOG IN"}</p>
        <h2 className="text-[24px] leading-[34px] font-bold text-text-primary">{isSignup ? "회원가입" : "로그인"}</h2>
        <p className="text-[12px] leading-[20px] text-text-muted">
          {isSignup ? "몇 가지 정보만 입력하면 바로 시작할 수 있어요." : "다시 오셨네요. 이어서 학습해 볼까요?"}
        </p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col items-start gap-[16px]">
        {isSignup && (
          <InputField
            id="name"
            label="이름"
            type="text"
            value={values.name}
            placeholder="홍길동"
            autoComplete="name"
            error={errors.name}
            onChange={update("name")}
          />
        )}
        <InputField
          id="email"
          label="이메일"
          type="email"
          value={values.email}
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email}
          onChange={update("email")}
        />
        <InputField
          id="password"
          label="비밀번호"
          type={showPassword ? "text" : "password"}
          value={values.password}
          placeholder={`${MIN_PASSWORD_LENGTH}자 이상`}
          autoComplete={isSignup ? "new-password" : "current-password"}
          error={errors.password}
          onChange={update("password")}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="shrink-0 text-[10px] leading-[16px] font-bold text-brand-purple"
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          }
        />

        {formError && (
          <p role="alert" className="text-[10px] leading-[15px] text-status-red">
            {formError}
          </p>
        )}

        <PrimaryButton
          type="submit"
          label={isSignup ? "회원가입" : "로그인"}
          disabled={submitting}
          className="mt-[8px] w-full disabled:opacity-60"
        />
      </form>

      <div className="h-px w-full bg-line" />

      <p className="text-[11px] leading-[18px] text-text-muted">
        {isSignup ? "이미 계정이 있나요? " : "아직 계정이 없나요? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-bold text-brand-purple hover:underline">
          {isSignup ? "로그인  →" : "회원가입  →"}
        </Link>
      </p>
    </>
  );
}
