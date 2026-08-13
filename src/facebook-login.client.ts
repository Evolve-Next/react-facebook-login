import { createScriptEle, objectToParams, paramsToObject } from './helpers';
import {
  DialogParams,
  InitParams,
  LoginOptions,
  LoginResponse,
  LoginStatus,
} from './types';

export const SDK_SCRIPT_ELE_ID = 'facebook-jssdk';

/** Normalizes the pre-encoded '%20' form to the space form — the JS SDK
 * URL-encodes option values itself, so 'code%20token' would be sent
 * double-encoded as 'code%2520token'. */
const normalizeResponseType = (options: LoginOptions): LoginOptions =>
  options.response_type === 'code%20token'
    ? { ...options, response_type: 'code token' }
    : options;

/** With `override_default_response_type` enabled, the JS SDK forwards
 * `response_type` to the OAuth dialog verbatim, so a lone 'code' never yields
 * an access token. Upgrade 'code' to the combined 'code token' value so
 * `authResponse` carries the authorization `code` together with `accessToken`
 * and `userID`. */
const withAccessToken = (options: LoginOptions): LoginOptions => {
  const normalized = normalizeResponseType(options);

  if (
    normalized.override_default_response_type === true &&
    normalized.response_type === 'code'
  ) {
    return { ...normalized, response_type: 'code token' };
  }

  return normalized;
};

export const FacebookLoginClient = {
  getFB: () => {
    if (!window.FB) {
      console.warn('FB not found');
      return null;
    }
    return window.FB;
  },
  getLoginStatus(
    callback: (res: LoginResponse) => void,
    isForcingRoudtrip = false
  ) {
    const FB = this.getFB();

    if (!FB) {
      callback({ status: 'unknown' as LoginStatus });
      return;
    }

    FB.getLoginStatus(callback, isForcingRoudtrip);
  },
  getProfile(callback: (res: unknown) => void, params: { fields: string }) {
    this.getFB()?.api('me', params, callback);
  },
  init(initParams: InitParams) {
    this.getFB()?.init(initParams);
  },
  clear() {
    window.FB = null;
    const scriptEle = document.getElementById(SDK_SCRIPT_ELE_ID);
    if (scriptEle) {
      scriptEle.remove();
    }
  },
  isRedirected(dialogParams?: DialogParams): boolean {
    const params = paramsToObject(window.location.search);

    return (
      (params['state'] === (dialogParams?.state ?? 'facebookdirect')) &&
      params[dialogParams?.response_type ?? ''] !== undefined
    );
  },
  async loadSdk(language: string, useCustomerChat?: boolean) {
    await createScriptEle(
      SDK_SCRIPT_ELE_ID,
      `https://connect.facebook.net/${language}/sdk${
        useCustomerChat ? '/xfbml.customerchat' : ''
      }.js`
    );
  },
  redirectToDialog(
    dialogParams: DialogParams,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { ignoreSdkError, ...loginOptions }: LoginOptions
  ) {
    window.location.href = `https://www.facebook.com/dialog/oauth${objectToParams(
      {
        ...dialogParams,
        ...withAccessToken(loginOptions),
      }
    )}`;
  },
  login(
    callback: (res: LoginResponse) => void,
    { ignoreSdkError, ...loginOptions }: LoginOptions
  ) {
    try {
      this.getFB()?.login(callback, withAccessToken(loginOptions));
    } catch (e) {
      if (ignoreSdkError) {
        return;
      } else {
        throw e;
      }
    }
  },
  logout(callback: (res?: unknown) => void) {
    this.getLoginStatus((res) => {
      if (res.status === 'connected') {
        this.getFB()?.logout(callback);
      } else {
        callback();
      }
    });
  },
};
