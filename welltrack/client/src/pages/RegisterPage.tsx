import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/apiClient";
import { validateDisplayName, validateEmail, validatePassword } from "../lib/validators";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [displayNameError, setDisplayNameError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    const nextDisplayNameError = validateDisplayName(displayName);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setDisplayNameError(nextDisplayNameError);
    if (nextEmailError || nextPasswordError || nextDisplayNameError) return;

    setIsSubmitting(true);
    try {
      await register({ email, password, displayName });
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_IN_USE") {
        setEmailError("That email is already registered.");
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      }
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
        <h1 className="text-2xl font-semibold text-teal-800">Create your account</h1>

        <div>
          <label htmlFor="displayName" className="block text-teal-700">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-teal-200 p-3"
          />
          {displayNameError && <p className="mt-1 text-sm text-red-600">{displayNameError}</p>}
        </div>

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
          {emailError && (
            <p className="mt-1 text-sm text-red-600">
              {emailError}{" "}
              {emailError.startsWith("That email") && (
                <Link to="/login" className="underline">
                  Log in instead
                </Link>
              )}
            </p>
          )}
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
          {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-teal-500 p-3 text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-sm">
          <Link to="/login" className="text-teal-600 hover:underline">
            Already have an account? Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
