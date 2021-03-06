import extend from 'xtend';
import EventEmitter from 'events';

import { mfaOauthErrorHandler } from './components/mfa/shared';
import ViewManager from './view-manager';
import utils from './utils';

import {
  AuthStrategy,
  CachedUserService,
  ClientApiUserService,
  CookieUserService,
  HttpProvider,
  LocalStorage,
  MemoryStorage,
  MockUserService,
  TokenStorage,
} from './data';

class Stormpath extends EventEmitter {
  static instance;
  static prefix = 'sp';
  static version = pkg.version;

  storage = null;
  tokenStorage = null;

  options = {
    appUri: null,
    authStrategy: null,
    container: null,
    templates: null
  };

  constructor(options) {
    super();

    if (Stormpath.instance) {
      throw new Error('It\'s only possible to initialize Stormpath once. To retrieve the already initialized instance, use Stormpath.getInstance().');
    }

    Stormpath.instance = this;

    // This needs to be fixed so that provided options override default.
    this.options = options = extend(this.options, options);

    this.storage = new LocalStorage();

    options.authStrategy = AuthStrategy.resolve(options.authStrategy, options.appUri);
    this.userService = this._createUserService(options.authStrategy, options.appUri);

    this._initializeUserServiceEvents();
    this._preloadViewModels();

    this.viewManager = new ViewManager(
      Stormpath.prefix,
      this.userService,
      options.templates,
      options.container
    );

    // Asynchronously handle any callback response.
    // This needs to happen after the ctor is done so any code after
    // new Stormpath() can set up event hooks watching for `loginError`
    setTimeout(this._handleCallbackResponse.bind(this));
  }

  static getInstance() {
    return Stormpath.instance;
  }

  _createUserService(authStrategy, appUri) {
    const httpProvider = new HttpProvider(appUri, authStrategy);

    let userService;

    switch (authStrategy) {
      case AuthStrategy.Token:
        this.tokenStorage = new TokenStorage(this.storage, httpProvider);
        userService = new ClientApiUserService(httpProvider, this.tokenStorage);
        break;

      case AuthStrategy.Cookie:
        userService = new CookieUserService(httpProvider);
        break;

      case AuthStrategy.Mock:
        userService = new MockUserService();
        break;
    }

    // Decorate our user service with caching
    userService = new CachedUserService(userService, new MemoryStorage());

    return userService;
  }

  _initializeUserServiceEvents() {
    this.userService.on('loggedIn', (...args) => this.emit('loggedIn', ...args));
    this.userService.on('loggedOut', (...args) => this.emit('loggedOut', ...args));
    this.userService.on('registered', (...args) => this.emit('registered', ...args));
    this.userService.on('authenticated', (...args) => this.emit('authenticated', ...args));
    this.userService.on('unauthenticated', (...args) => this.emit('unauthenticated', ...args));
    this.userService.on('forgotPasswordSent', (...args) => this.emit('forgotPasswordSent', ...args));
    this.userService.on('passwordChanged', (...args) => this.emit('passwordChanged', ...args));

    // Make an initial request to getState() in order to trigger our first user events.
    this.userService.getState();
  }

  _preloadViewModels() {
    this.userService.getLoginViewModel().catch(() => {});
    this.userService.getRegistrationViewModel().catch(() => {});
    this.userService.getForgotEndpointResponse().catch(() => {});
  }

  _handleDisabledEndpoint(name, uri) {
    /* eslint-disable no-console */
    console.error(name + ' endpoint could not be loaded.  Ensure that the ' + uri + ' is enabled on the provided Client API domain, or on your local server if not using Client API.');
  }

  _handleCallbackResponse() {
    const parsedQueryString = utils.parseQueryString(utils.getWindowQueryString());
    const error = parsedQueryString.error;
    const errorDescription = parsedQueryString.error_description;

    if (error) {
      const errorMessage = 'Provider Callback Error: ' + error + (errorDescription ? (' (' + errorDescription + ')') : '');
      this.emit('loginError', new Error(errorMessage));
    }

    const assertionToken = parsedQueryString.jwtResponse;

    if (!assertionToken) {
      return;
    }

    if (window.history.replaceState) {
      const cleanedLocation = window.location.toString()
        .replace('jwtResponse=' + assertionToken, '');

      window.history.replaceState(null, null, cleanedLocation);
    }

    this.userService.tokenLogin(assertionToken)
      .catch((err) => {
        mfaOauthErrorHandler(err, this.viewManager)
          .then(this.viewManager.remove.bind(this.viewManager))
          .catch((err) => this.emit('loginError', err.message));
      });
  }

  getAccount() {
    return this.userService.getAccount();
  }

  getAccessToken() {

    if (!this.tokenStorage) {
      return Promise.reject(new Error('Token storage is not configured.'));
    }

    return this.tokenStorage.getAccessToken();
  }

  showChangePassword(token) {
    const parsedQueryString = utils.parseQueryString(window.location.search);
    this.viewManager.showChangePassword(token || parsedQueryString.sptoken);
  }

  showForgotPassword() {
    return this.viewManager.showForgotPassword();
  }

  showLogin() {
    this.userService.getLoginViewModel()
      .then(this.viewManager.showLogin.bind(this.viewManager))
      .catch(this._handleDisabledEndpoint.bind(null, 'Login', '/login'));
  }

  showRegistration() {
    this.userService.getRegistrationViewModel()
      .then(this.viewManager.showRegistration.bind(this.viewManager))
      .catch(this._handleDisabledEndpoint.bind(null, 'Registration', '/register'));
  }

  showEmailVerification(token) {
    const parsedQueryString = utils.parseQueryString(utils.getWindowQueryString());
    this.viewManager.showEmailVerification(token || parsedQueryString.sptoken);
  }

  showEnrollMfa(type) {
    let selectedFactor;

    if (type) {
      selectedFactor = {
        id: type,
        type: type
      };
    }

    this.viewManager.showEnrollMfa({
      section: selectedFactor ? 'setup' : 'select',
      selectedFactor: selectedFactor
    });
  }

  logout() {
    return this.userService.logout()
      .then(this.remove.bind(this));
  }

  remove() {
    return this.viewManager.remove();
  }

}

export default Stormpath;
