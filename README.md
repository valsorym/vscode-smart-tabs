[![Stay with Ukraine](https://img.shields.io/static/v1?label=Stay%20with&message=Ukraine%20♥&color=ffD700&labelColor=0057B8&style=flat)](https://u24.gov.ua/)

# Smart Tabs for Visual Studio Code

Enhance your tab management in Visual Studio Code with `Smart Tabs`! This extension automatically repositions tabs with modified content, making them easily accessible, especially when dealing with a multitude of open files.

## Features

- Intelligent Tab Movement: Once you modify content in a tab, Smart Tabs will automatically move it closer to the left or right edge of your tab list, depending on your preference.

- Respect for Pinned Tabs: If you've pinned certain tabs to ensure they remain in specific positions, Smart Tabs will recognize this and ensure that these pinned tabs aren't disturbed by any automatic movements.

- Configurable Fixed Tab Positions: You can specify a set number of tabs that always remain at the beginning or end of your tab list. These tabs will not be impacted by the automatic tab movement behavior of Smart Tabs.

## How It Works

1. Upon a content modification in any tab, the extension triggers the smart-tabs.moveTab command.

2. Smart Tabs then checks your specified configurations to determine the desired behavior.

3. Before executing the move, it takes into account any pinned tabs and calculates the right position for the modified tab.

4. The tab is finally repositioned using the VS Code `moveActiveEditor` command.


## Configuration Options

### smart-tabs.activeFirst

**Type**: Boolean

**Default**: false

Determines the direction of movement for the modified tab.

- If set to true, the modified tab will be moved towards the beginning (left side) of the tab list.
- If set to false, the tab will be moved towards the end (right side).

## smart-tabs.fixedTabs

**Type**: Integer (Range: 1-9)

**Default**: 5

Specifies the number of tabs that should always remain fixed either at the start or end of the tab list. This depends on the `activeFirst` value. Tabs within this fixed group will not be automatically moved, even if their content is modified.

## Installation

1. Open Visual Studio Code and Navigate to Extensions.
2. Search for `Smart Tabs` by `Valsorym`.
3. Click `install` and enjoy enhanced tab management!


## Feedback and Contribution

Your feedback is valuable! If you have any suggestions, issues, or would like to contribute, please raise an issue on our [GitHub repository](https://github.com/valsorym/vscode-smart-tabs).

## License

Copyright valsorym, 2022-2023.

## Release Notes

Updated license.

### 0.1.3

- New license.

### 0.1.0

- Change icon.
- Fixed problems with moving tabs in front of pinned tabs.
- Fixed problems with moving pinned tabs.

### 0.0.3

- Change icon.
- Fixed minor bugs.

### 0.0.2

- Change icon.
- Fixed the bug of moving tabs with the same label.

### 0.0.1

- Initial.
