interface Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
  google?: {
    accounts: {
      id: {
        initialize: (config: any) => void;
        renderButton: (element: HTMLElement, config: any) => void;
        prompt: () => void;
      };
      oauth2: {
        initTokenClient: (config: any) => {
          requestAccessToken: (options?: { prompt?: string }) => void;
        };
      };
    };
  };
}