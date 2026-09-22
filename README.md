# MyMutuals

MyMutuals is a small Chrome extension that filters the Following list on your own X profile to show accounts that do not follow you back.

It works locally in the page. It does not call X APIs, send account data to a server, or download your complete followers list. Instead, it checks the `Follows you` marker X renders in each currently loaded Following row and hides marked mutuals when the toggle is on.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this project's `extension` folder.
4. Open your own `x.com/<handle>/following` page and refresh it.

The **Non-followers** toggle appears above the list. Its state is saved locally in Chrome extension storage.

## Scope and limitations

- The toolbar appears only on the logged-in account's own Following page.
- It filters the rows X has loaded into the page; scroll to load more accounts.
- Classification depends on X rendering its `Follows you` indicator. This is not an independent full-list comparison.
- The feature measures follow-back status only; it does not fetch profile timelines or activity data.
