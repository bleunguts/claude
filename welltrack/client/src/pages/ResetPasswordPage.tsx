import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPasswordRequest } from "../lib/authApi";
import { ApiError } from "../lib/apiClient";
import { validatePassword } from "../lib/validators";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    const nextPasswordError = validatePassword(newPassword);
    setPasswordError(nextPasswordError);
    if (nextPasswordError) return;

    setIsSubmitting(true);
    try {
      await resetPasswordRequest({ token, newPassword });
      setSucceeded(true);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? "This reset link is invalid or has expired. Request a new one."
          : "Something went wrong. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-teal-800">Invalid reset link</h1>
          <p className="text-teal-700">This password reset link is missing its token.</p>
          <Link to="/forgot-password" className="text-teal-600 hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (succeeded) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-teal-800">Password updated</h1>
          <p className="text-teal-700">You can now log in with your new password.</p>
          <Link to="/login" className="text-teal-600 hover:underline">
            Go to log in
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
        <h1 className="text-2xl font-semibold text-teal-800">Reset password</h1>

        <div>
          <label htmlFor="newPassword" className="block text-teal-700">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-teal-200 p-3"
          />
          {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-teal-500 p-3 text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
