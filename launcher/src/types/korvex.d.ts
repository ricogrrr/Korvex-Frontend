export interface KorvexWindowApi {
  minimize(): void;
  toggleMaximize(): void;
  close(): void;
  isMaximized(): Promise<boolean>;
  onMaximizeChange(cb: (maximized: boolean) => void): () => void;
}

export interface KorvexAuthApi {
  /** Embedded Microsoft login window; resolves {code} or {canceled}. */
  login(authorizeUri: string): Promise<{ code?: string; canceled?: boolean }>;
}

declare global {
  interface Window {
    /** Undefined when the renderer runs in a plain browser (vite without electron). */
    korvex?: { window: KorvexWindowApi; auth?: KorvexAuthApi };
  }
}
