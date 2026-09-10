import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/apiClient";
import { validateEmail } from "../lib/validators";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    const emailValidationError = validateEmail(email);
    setEmailError(emailValidationError);
    if (emailValidationError || !password) {
      if (!password) setFormError("Password is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      const from = (location.state as { from?: Location })?.from;
      navigate(from?.pathname ?? "/", { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow-sm"
        noValidate
      >
        <h1 className="text-2xl font-semibold text-teal-800">Log in</h1>

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

        <div>
          <label htmlFor="password" className="block text-teal-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-teal-200 p-3"
          />
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-teal-500 p-3 text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>

        <div className="flex justify-between text-sm">
          <Link to="/forgot-password" className="text-teal-600 hover:underline">
            Forgot password?
          </Link>
          <Link to="/register" className="text-teal-600 hover:underline">
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
}
