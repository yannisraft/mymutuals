# MyMutuals

MyMutuals is a Chrome extension that adds a local Non-followers filter to X's existing Following list.

## Install for development

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this project's `extension` folder.
4. Open your own `x.com/<handle>/following` page and refresh it.

## How it works

MyMutuals does not call X APIs, replay X requests, or create a second list. It observes only the Following rows X has already rendered and applies a small local toolbar plus a CSS filter to those same rows.

X remains responsible for scrolling and loading its own list. MyMutuals does not prefetch, accumulate, or request accounts in the background.

The **Non-followers** toggle uses X's rendered `Follows you` marker. No account data is sent to a server.

## Limitation

Because this version is DOM-only, it can only filter accounts that X has rendered at that moment. X's own virtualized list may re-render rows as you scroll.
