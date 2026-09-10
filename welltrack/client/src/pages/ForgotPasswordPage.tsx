import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../lib/authApi";
import { ApiError } from "../lib/apiClient";
import { validateEmail } from "../lib/validators";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    if (nextEmailError) return;

    setIsSubmitting(true);
    try {
      await forgotPasswordRequest(email);
      setSubmitted(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-teal-800">Check your email</h1>
          <p className="text-teal-700">
            If that email is registered, a password reset link has been sent.
          </p>
          <Link to="/login" className="text-teal-600 hover:underline">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm"
        noValidate
      >
        <h1 className="text-2xl font-semibold text-teal-800">Forgot password</h1>
        <p className="text-teal-700">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <div>
          <label htmlFor="email" className="block text-teal-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-teal-200 p-3"
          />
          {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-teal-500 p-3 text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>

        <p className="text-center text-sm">
          <Link to="/login" className="text-teal-600 hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </div>
  );
}
