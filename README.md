# Smart Tabs

The `Smart Tabs` extension is used to automatically move tab with modified content closer to the left or right edge of the list of tabs.

## Features

When many tabs are open in the editor, and changes occur only in some, and the work process requires regular switching between them, then such tabs are moved to the beginning (or end) of the list of tabs for faster interaction between them.

## Extension Settings

The following parameters can be used to configure the extension:

- `smart-tabs.activeFirst` - Boolean value as true or false that determines the direction of movement of the modified tab. If true (default), the tab will be moved to the beginning of the tab list.
- `smart-tabs.fixedTabs` - An integer value from 1 to 9 that indicates the number of fixed tabs from the beginning or end of the tab list (depending on the activeFirst value). Changing data in pinned tabs does not move the tab to the beginning or end of the tab list.

## Release Notes

Improved performance of the extension.

### 0.0.3

- Change icon.
- Fixed minor bugs.

### 0.0.2

- Change icon.
- Fixed the bug of moving tabs with the same label.

### 0.0.1

- Initial.
