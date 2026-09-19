import { FacebookLoginClient } from '../src/facebook-login.client';
import { FB, LoginOptions } from '../src/types';

const login = jest.fn();

beforeAll(() => {
  window.FB = { login } as unknown as FB;
});

beforeEach(() => {
  login.mockClear();
});

const loginWith = (options: LoginOptions) =>
  FacebookLoginClient.login(jest.fn(), options);

test('preserves response_type code when override_default_response_type is true', () => {
  loginWith({
    scope: 'business_management',
    config_id: '1616820273166112',
    override_default_response_type: true,
    response_type: 'code',
  });

  expect(login).toHaveBeenCalledWith(
    expect.any(Function),
    expect.objectContaining({
      response_type: 'code',
      override_default_response_type: true,
    })
  );
});

test('keeps response_type when override_default_response_type is not set', () => {
  loginWith({ scope: 'public_profile', response_type: 'code' });

  expect(login).toHaveBeenCalledWith(
    expect.any(Function),
    expect.objectContaining({ response_type: 'code' })
  );
});

test('keeps non-code response types untouched', () => {
  loginWith({ scope: 'public_profile', response_type: 'token' });

  expect(login).toHaveBeenCalledWith(
    expect.any(Function),
    expect.objectContaining({ response_type: 'token' })
  );
});

test('normalizes the pre-encoded code%20token form to the space form', () => {
  loginWith({ scope: 'public_profile', response_type: 'code%20token' });

  expect(login).toHaveBeenCalledWith(
    expect.any(Function),
    expect.objectContaining({ response_type: 'code token' })
  );
});
