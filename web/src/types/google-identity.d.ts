export {};

declare global {
  /** Google Identity Services (One Tap / Sign-In button). */
  interface GoogleIdentityConfig {
    client_id: string;
    callback: (response: { credential: string; select_by?: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: "signin" | "signup" | "use";
    itp_support?: boolean;
    use_fedcm_for_prompt?: boolean;
  }

  interface GooglePromptMomentNotification {
    isDisplayMoment: () => boolean;
    isDisplayed: () => boolean;
    isNotDisplayed: () => boolean;
    getNotDisplayedReason: () => string;
    isSkippedMoment: () => boolean;
    getSkippedReason: () => string;
    isDismissedMoment: () => boolean;
    getDismissedReason: () => string;
  }

  interface GoogleRenderButtonConfig {
    type?: "standard" | "icon";
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    logo_alignment?: "left" | "center";
    width?: number;
    locale?: string;
  }

  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdentityConfig) => void;
          prompt: (listener?: (notification: GooglePromptMomentNotification) => void) => void;
          cancel: () => void;
          renderButton: (parent: HTMLElement, config: GoogleRenderButtonConfig) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
