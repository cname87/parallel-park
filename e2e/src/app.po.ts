import { browser, by, element } from 'protractor';

export class AppPage {
  async navigateTo(): Promise<unknown> {
    return browser.get(browser.baseUrl);
  }

  async getTitleText(): Promise<boolean> {
    return element(by.css('app-root')).isPresent();
  }
}
