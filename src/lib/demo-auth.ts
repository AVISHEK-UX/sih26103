export const DEMO_CREDENTIALS = {
  email: "admin@pragukti.gov.in",
  password: "pragukti2026",
} as const;

const SESSION_KEY = "pragukti-demo-authenticated";

export function isDemoAuthenticated(): boolean {
  return typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "true";
}

export function startDemoSession(): void {
  sessionStorage.setItem(SESSION_KEY, "true");
}

export function endDemoSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
