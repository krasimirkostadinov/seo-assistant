import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { HomePage } from "./pages/HomePage.tsx";
import { AppHeader } from "./components/AppHeader.tsx";
import { LoginPage } from "./components/LoginPage.tsx";
import { useTheme, decodeOAuthErrorDescription } from "@shared/index.ts";

export function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, error } = useAuth0();
  const { isDark, toggle } = useTheme();
  const [oauthCallbackError, setOauthCallbackError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    const desc = params.get("error_description");
    if (!err) return;
    setOauthCallbackError(desc ? decodeOAuthErrorDescription(desc) : err);
    const url = new URL(window.location.href);
    for (const key of ["error", "error_description", "state"]) url.searchParams.delete(key);
    window.history.replaceState({}, "", url.pathname + (url.search || "") + url.hash);
  }, []);

  if (isLoading) {
    return <p className="p-10 text-center text-sf-muted" data-testid="auth-loading">Loading…</p>;
  }

  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={() => { setOauthCallbackError(null); void loginWithRedirect(); }}
        errorMessage={error?.message ?? oauthCallbackError}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader
        isDark={isDark}
        onToggleTheme={toggle}
        onLogout={() => void logout({ logoutParams: { returnTo: window.location.origin } })}
      />
      <HomePage />
    </div>
  );
}
