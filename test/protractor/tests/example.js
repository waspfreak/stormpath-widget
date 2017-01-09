import { expect } from 'chai';
import ExampleApp from '../page-objects/example-app';

describe('Example App', () => {
  const app = new ExampleApp();

  beforeEach((done) => {
    app.loadAt(browser.params.exampleAppUri).then(done);
  });

  it('should have a Login button', () => {
    expect(app.loginButton().isVisible()).to.eventually.equal(true);
  });
});
