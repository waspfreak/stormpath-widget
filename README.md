# Stormpath Widget

Add beautiful login, registration, and multi-factor authentication screens to your app in only a few lines of code!  To get started, please signup for a free developer account at https://api.stormpath.com/register.

> :racehorse: &nbsp;To see a live demo, please visit https://stormpath-widget.herokuapp.com :racehorse:

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Customization](#customization)
- [Reference](#reference)
  - [API](#api)
  - [Events](#events)


## Installation

Ready to add authentication to your application?  Simply add a reference to the Stormpath widget in your HTML code:

```html
<script src="https://cdn.stormpath.io/widget/0.x/stormpath.min.js"></script>
```

The widget uses the [Stormpath Client API][] to authenticate the user.  Every Stormpath Application has a Client API domain, you can find the domain in the Stormpath Admin Console, under the application's "Policies" menu.  Once you have obtained the URL, configure the widget in your front-end application:

```html
<script>
  window.stormpath = new Stormpath({
    appUri: 'https://your-domain.apps.stormpath.io'
  });
</script>
```

You will need to tell Stormpath where your front-end application is running, by adding it's domain to the list of **Authorized Origin URIs** on your Stormpath Application.  This can be done from the Stormpath Admin Console.  For example, if you are developing on a local sever that runs your front-end app at `http://localhost:3000`, you need to add that URI to the list

If this is not done, you will see the error `Origin 'http://localhost:3000' is therefore not allowed access.` in the browser error log.

If you will be using social login, you will also need to add this URI to the list of **Authorized Callback URIs**, otherwise you will see the error `Specified redirect_uri is not in the application's configured authorized callback uri's.` when you attempt social login.

## Usage

> :bulb: To see a full code example, check out our [example application](example/index.html).

When you are ready to show the login view, just call `stormpath.showLogin()`:

```html
<button onclick="stormpath.showLogin()">Log in</button>
```

Similarly, to show the registration interface, call `stormpath.showRegistration()`:

```html
<button onclick="stormpath.showRegistration()">Create account</button>
```

When the user successfully authenticates, the widget emits an `authenticated` event. You can use this to update the page. For example, you could show a Log out button once the user logs in by adding this to your `<script>` tag:

```javascript
stormpath.on('authenticated', function() {
  console.log('You\'re authenticated!');

  document.getElementById('logout-btn').style.display = 'block';
});
```

The Log out button would simply need to call `stormpath.logout()`:

```html
<button id="logout-btn" onclick="stormpath.logout()" style="display:none;">Log out</button>
```

To understand everything that the widget is capable of doing, keep reading!

### Modal vs. container mode

By default, the widget will display a modal (pop-up) on your page. If you want, you can display the widget inside of an existing `<div>` or other DOM element on your page. To do this, pass a DOM node to the widget via the `container` parameter:

```javascript
window.stormpath = new Stormpath({
  appUri: 'https://foo-bar.apps.stormpath.io',
  container: document.getElementById('widget')
});
```

You can remove the rendered elements from the DOM at any time by calling `stormpath.remove()`.

## Customization

The widget includes a set of default styles and templates that work out-of-the-box. If you want the widget to better match the existing look and feel of your site, you can override the styles, or provide your own templates.

### Applying new styles

The templates rendered by the widget contain HTML elements marked with `sp-*` classes. You can override the styles on these classes to provide your own styling. For example,

```html
<style type="text/css">
  .sp-login-component .sp-submit-btn {
    background-color: lightgreen;
  }
</style>
```

This changes the color of the **Log in** button on the widget's Login interface to green.

If you need to make changes to the HTML elements themselves, you'll need to provide your own templates.

### Customizing the templates

The views the widget renders are split up into logical [components](https://github.com/stormpath/stormpath-widget/tree/master/src/components), e.g. login, registration, forgot password, and so on. Each one of these components has a default HTML template that can be replaced with your own HTML.

To specify a custom template, pass a `templates` hash when initializing the `Stormpath` object:

```javascript
window.stormpath = new Stormpath({
  appUri: 'https://foo-bar.apps.stormpath.io',
  templates: {
    login: "<h1>Login form, yo! More HTML here.</h1>",
  }
});
```

You can also pass a reference to an existing DOM node:

```javascript
window.stormpath = new Stormpath({
  appUri: 'https://foo-bar.apps.stormpath.io',
  templates: {
    login: document.getElementById('my-custom-login-form'),
  }
});
```

Elsewhere on the page, you can stash your template in a hidden `<div>`:

```html
<div style="display: none;">
  <div id="my-custom-login-form">
    <h1>Login form, yo! More HTML here.</h1>
  </div>
</div>
```

For each component, you can pass:

* a string containing HTML
* an existing DOM node containing elements
* a function that resolves to a string or a DOM node

Under the hood, the widget uses the [Rivets](https://github.com/mikeric/rivets) library for lightweight data binding. Your template code can make use of `rv-*` attributes to bind data and behavior. For examples, refer to the default [components](https://github.com/stormpath/stormpath-widget/tree/master/src/components) views.

## Reference

### API

#### new Stormpath(options)

Creates a new instance of the Stormpath widget, but doesn't show anything until invoked with a `showXYZ` method. The allowed options are:

* **appUri** - The address of your web server or Stormpath application (like `foo-bar.apps.stormpath.io`). If left blank, the widget will attempt to connect to a server running on the current domain.
* **container** - Pass a DOM element to render the widget to. If null, the widget will default to modal mode.
* **authStrategy** - Either `cookie`, `token`. If null, the widget will automatically pick the best strategy to use (`cookie` when connecting to a server on the same domain, `token` when connecting cross-domain).

#### getAccount() ```Promise.<Account, Error>```

Gets the user's Stormpath account object, if the user is currently logged in.

#### getAccessToken() ```Promise.<JwtString, Error>```

Gets the user's current access token, if a user is currently logged in.  This does not work in if the ``authStrategy`` is `cookie`, in that mode it is assumed that the cookies are not readable by JS (`httpOnly`).  This is likely the case if you are using one of our framework integrations on your server.

#### logout() ```Promise.<null, Error>```

Logs the user out, the access token and refresh tokens are revoked.

#### showLogin()

Shows the login interface.

#### showRegistration()

Shows the registration interface.

#### showForgotPassword()

Shows the password reset interface.

#### showChangePassword(sptoken)

Trigger the last step of the password reset workflow. The widget fetches the `sptoken` from the URL if it's not passed explicitly.

To distinguish from email verification, we recommend that you set the [Link Base URL of your directory](https://docs.stormpath.com/rest/product-guide/latest/accnt_mgmt.html#customizing-stormpath-email-templates) to `http://example.com#change-password`, and then invoke the widget like so:

```javascript
if ((/#change-password/).test(window.location.href)) {
  stormpath.showChangePassword();
}
```

#### showEnrollMfa(type)

Shows the MFA flow for enrolling a specific factor. Available types are `google-authenticator` and `sms`.

#### showEmailVerification(sptoken)

Trigger the email verification workflow. This is used when the user is landing on your app after clicking the email verification link. The widget fetches the `sptoken` from the URL if it's not passed explicitly.

To distinguish from password reset, we recommend that you set the [Link Base URL of your directory](https://docs.stormpath.com/rest/product-guide/latest/accnt_mgmt.html#customizing-stormpath-email-templates) to `http://example.com#verify`, and then invoke the widget like so:

```javascript
if ((/#verify/).test(window.location.href)) {
  stormpath.showEmailVerification();
}
```

#### remove()

Removes the widget from the DOM. This is useful when you are rendering the widget to your own container element.

### Events

These are the events that are emitted from the `Stormpath` instance.

```javascript
stormpath.on('loggedIn', function onLoggedIn() {
  console.log('User logged in!');
});
```

#### `authenticated`

This event is either emitted directly when the Stormpath instance is created and a session is present, or after a user logs in.

#### `unauthenticated`

This event is either emitted directly when the Stormpath instance is created and no session is present, or after a user logs out.

#### `registered`

This event is emitted when a new account is created.

#### `loggedIn`

This event is emitted once a user logs in.

#### `loggedOut`

This event is emitted once a user logs out.

[Stormpath Client API]: https://docs.stormpath.com/client-api/product-guide/latest/

## Contributing

Want to submit a pull request or debug an issue?  Please see the [CONTRIBUTING](CONTRIBUTING.MD) document for more information on how to develop for this project.
