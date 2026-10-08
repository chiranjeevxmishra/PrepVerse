import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client';
let googleScriptPromise;

const loadGoogleIdentityServices = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      let script = document.querySelector(`script[src="${GOOGLE_SCRIPT}"]`);
      const onLoad = () => window.google?.accounts?.id
        ? resolve(window.google.accounts.id)
        : reject(new Error('Google sign-in could not be initialized.'));
      const onError = () => reject(new Error('Google sign-in could not load. Check your connection and try again.'));
      if (!script) {
        script = document.createElement('script');
        script.src = GOOGLE_SCRIPT;
        script.async = true;
        script.defer = true;
        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', onError, { once: true });
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', onError, { once: true });
      }
    }).catch((error) => {
      googleScriptPromise = null;
      throw error;
    });
  }
  return googleScriptPromise;
};

const GoogleSignInButton = ({ onCredential, onError, disabled = false }) => {
  const containerRef = useRef(null);
  const [configurationError, setConfigurationError] = useState('');
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    let active = true;
    if (!clientId) {
      setConfigurationError('Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in the client environment.');
      return () => { active = false; };
    }
    setConfigurationError('');

    loadGoogleIdentityServices().then((googleId) => {
      if (!active || !containerRef.current) return;
      googleId.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response?.credential) {
            onError('Google did not return an ID token. Please try again.');
            return;
          }
          onCredential(response.credential);
        },
      });
      containerRef.current.replaceChildren();
      googleId.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(containerRef.current.clientWidth || 380, 400),
      });
    }).catch((error) => {
      if (active) setConfigurationError(error.message);
    });

    return () => { active = false; };
  }, [clientId, onCredential, onError]);

  if (configurationError) {
    return <p className="text-center text-xs text-amber-300" role="status">{configurationError}</p>;
  }

  return (
    <div className={disabled ? 'pointer-events-none flex min-h-10 justify-center opacity-50' : 'flex min-h-10 justify-center'}>
      <div ref={containerRef} />
    </div>
  );
};

export default GoogleSignInButton;
