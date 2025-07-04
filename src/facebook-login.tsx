import React, { useEffect } from 'react';

import {
  DialogParams,
  InitParams,
  LoginOptions,
  FacebookLoginProps,
} from './types';

import { FacebookLoginClient } from './facebook-login.client';
import { isFacebookApp } from './helpers';

const FacebookLogin: React.FC<FacebookLoginProps> = (props) => {
  const {
    appId,
    style,
    onFail,
    render,
    onSuccess,
    className,
    autoLoad = false,
    onProfileSuccess,
    language = 'en_US',
    useRedirect = false,
    useCustomerChat = false,
    fields = 'name,email,picture',
    scope = 'public_profile, email',
    children = 'Login with Facebook',
  } = props;

  const initParams: InitParams = {
    version: 'v17.0',
    xfbml: false,
    cookie: false,
    localStorage: true,
    ...props.initParams,
    appId,
  };
  const dialogParams: DialogParams = {
    redirect_uri:
      typeof window !== 'undefined' ? location.origin + location.pathname : '/',
    state: 'facebookdirect',
    response_type: 'code',
    ...props.dialogParams,
    client_id: appId,
  };
  const loginOptions: LoginOptions = {
    return_scopes: false,
    ignoreSdkError: false,
    ...props.loginOptions,
    auth_nonce:
      typeof props.loginOptions?.auth_nonce === 'function'
        ? props.loginOptions.auth_nonce()
        : props.loginOptions?.auth_nonce,
    scope,
  };

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    await FacebookLoginClient.loadSdk(language, useCustomerChat);
    window.fbAsyncInit = () => {
      FacebookLoginClient.init(initParams);
      const isRedirected = FacebookLoginClient.isRedirected(dialogParams);
      if (isRedirected === false && autoLoad) {
        handleButtonClick();
        return;
      }
      if (isRedirected === true && useRedirect) {
        requestLogin();
      }
    };
  };

  const requestLogin = () => {
    FacebookLoginClient.login(
      (res) => {
        if (!res.authResponse) {
          onFail && onFail({ status: 'loginCancelled' });
          return;
        }

        onSuccess && onSuccess(res.authResponse);

        if (onProfileSuccess) {
          FacebookLoginClient.getProfile(onProfileSuccess, { fields });
        }
      },
      { ...loginOptions, scope }
    );
  };

  const handleButtonClick = () => {
    if (isFacebookApp() || useRedirect) {
      FacebookLoginClient.redirectToDialog(dialogParams, loginOptions);
      return;
    }

    if (!window.FB) {
      onFail && onFail({ status: 'facebookNotLoaded' });
      return;
    }

    requestLogin();
  };

  if (render) {
    return render({
      onClick: handleButtonClick,
      logout: FacebookLoginClient.logout,
    });
  }

  return (
    <button
      type="button"
      style={style}
      className={className}
      onClick={handleButtonClick}
    >
      {children}
    </button>
  );
}

export default FacebookLogin;