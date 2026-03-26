import { BrandHeader } from "@shared/BrandHeader.tsx";

type Props = {
  onLogin: () => void;
  errorMessage: string | null;
};

export function LoginPage({ onLogin, errorMessage }: Props) {
  const showAudienceHint =
    errorMessage && /service not found|your-api-identifier/i.test(errorMessage);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-sf-border bg-sf-surface px-6 py-8 text-center shadow-lg shadow-stone-900/8 ring-1 ring-sf-border-subtle backdrop-blur-sm sm:px-8">
        <div
          aria-hidden
          className="-mx-6 -mt-8 mb-6 h-1 bg-linear-to-r from-sf-primary/90 via-sf-primary/40 to-sf-teal/50 sm:-mx-8"
        />
        <BrandHeader description="Sign in to run the SEO agent against live pages." />
        <button
          type="button"
          className="mt-8 w-full rounded-xl bg-sf-primary px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-sf-primary/25 transition-colors hover:bg-sf-primary-hover sm:w-auto sm:min-w-40"
          onClick={onLogin}
        >
          Log in
        </button>
      </div>
      {errorMessage ? (
        <div
          className="max-w-md rounded-xl border border-red-200 bg-red-50/95 px-4 py-3 text-left text-sm text-red-900 shadow-md shadow-stone-900/6"
          role="alert"
        >
          <p className="font-medium text-red-950">Sign-in failed</p>
          <p className="mt-1.5 text-red-800">{errorMessage}</p>
          {showAudienceHint ? (
            <p className="mt-3 text-xs leading-relaxed text-sf-muted">
              <code className="text-sf-text/90">https://your-api-identifier</code> is only an
              example. In the Auth0 Dashboard, open{" "}
              <strong className="text-sf-text/90">APIs</strong> in the left sidebar, copy the{" "}
              <strong className="text-sf-text/90">Identifier</strong>, and use it for{" "}
              <code className="text-sf-text/90">VITE_AUTH0_AUDIENCE</code> and{" "}
              <code className="text-sf-text/90">AUTH0_AUDIENCE</code>, then restart both servers.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
