// SMART TABS
// Automatically moves changed tabs to the beginning/end of the group.
// Author: valsorym <i@valsorym.com>
import * as vscode from 'vscode';


// The first/last number of tabs that don't respond to changes.
const FIXED_TABS = 3;

// The direction of moving tabs to the left (true) or to the right (false).
const ACTIVE_FIRST: boolean = false;

// Returns first not pinned tab number or zero.
function getNotPinnedTabNum(activeGroup: vscode.TabGroup): number {
    for (let i = 0; i < activeGroup.tabs.length; i++) {
        if (!activeGroup.tabs[i].isPinned) {
            return i;
        }
    }

    return 0;
}

// Returns current active tab number or zero. If fromLeft is true tabs
// are counted from the left, otherwise from the right. 
function getActiveTabNum(
    activeGroup: vscode.TabGroup,
    fromLeft: boolean,
): number {
    const activeTab = activeGroup.activeTab;
    for (let i = 0; i < activeGroup.tabs.length; i++) {
        // Try to find current tab index. 
        const tab = activeGroup.tabs[i];
        if (tab.isActive && activeTab?.label === tab.label) {
            if (fromLeft) {
                return i; // move to the left
            } else {
                return activeGroup.tabs.length - (i + 1); // move to the right
            }
        }
    }

    return 0;
}

// Activate extension.
export function activate(context: vscode.ExtensionContext) {
    // Subscribe on smart-tabs.moveTab command.
    context.subscriptions.push(
        vscode.commands.registerCommand('smart-tabs.moveTab', () => {
            // Get configs.
            // Configurations can be left blank, then default
            // values will be used.
            const config = vscode.workspace.getConfiguration("smart-tabs");
            const fixedTabs = config.get("fixedTabs", FIXED_TABS);
            const activeFirst = config.get("activeFirst", ACTIVE_FIRST);

            // Get the active group of tabs.
            // Stop the command execution if there is no active group of tabs.
            const activeGroup = vscode.window.tabGroups.all.filter(
                (group) => group.isActive
            )[0];

            if (!activeGroup) {
                return;
            }

            // Get the index of the current tab (active editor).
            // Abort command execution if the active tab is in the Fixed group.
            const activeTabNum = getActiveTabNum(activeGroup, activeFirst);
            if (activeTabNum < fixedTabs) {
                return;
            }

            // Depending on the direction of movement, move the tab
            // to the extreme position.
            if (activeFirst) {
                vscode.commands.executeCommand('moveActiveEditor', {
                    to: 'first',
                    by: 'tab',
                    value: activeTabNum - getNotPinnedTabNum(activeGroup),
                });
            } else {
                vscode.commands.executeCommand('moveActiveEditor', {
                    to: 'last',
                    by: 'tab',
                });
            }
        }), // smart-tabs.moveTab
    );

    // Move tabs when modifying a document.
    // Option: `vscode.workspace.onWillSaveTextDocument`.
    vscode.workspace.onDidChangeTextDocument((e) => {
        vscode.commands.executeCommand('smart-tabs.moveTab');
    });
}

// Deactivate extension.
export function deactivate() {
    vscode.window.showErrorMessage('Successfully deactivated extension.');
}