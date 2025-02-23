import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as AppDisplay from 'resource:///org/gnome/shell/ui/appDisplay.js';
import Gio from 'gi://Gio';

export default class OpenDesktopLocationExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._originalPopupMenu = null;
    }

    enable() {
        // Save the original popupMenu function to the prototype
        if (!this._originalPopupMenu) {
            this._originalPopupMenu = AppDisplay.AppIcon.prototype.popupMenu;
        }
        const originalPopupMenu = this._originalPopupMenu;

        // Replace the popupMenu method with our custom version
        AppDisplay.AppIcon.prototype.popupMenu = function (side = imports.gi.St.Side.LEFT) {
            // Call the original popupMenu method
            originalPopupMenu.call(this, side);

            // Ensure the menu exists
            if (!this._menu) {
                log('No context menu found for the app icon.');
                return false;
            }

            // If the custom menu item is already added, skip
            if (this._customMenuItemFolder) return false;
            if (this._customMenuItemFile) return false;

            // Add a new custom item to the context menu
            this._customMenuItemFolder = new PopupMenu.PopupMenuItem('Open .desktop location');
            this._customMenuItemFolder.connect('activate', () => {
                const desktopInfo = this.app.get_app_info();
                const desktopFilePath = desktopInfo?.get_filename();

                if (!desktopFilePath) {
                    log('No .desktop file found for the selected app.');
                    return;
                }

                // Close the overview window
                if (Main.overview.visible) {
                    log('Hiding overview...');
                    Main.overview.hide();
                }

                // Open the folder containing the .desktop file
                const folder = Gio.File.new_for_path(desktopFilePath).get_parent();
                if (folder) {
                    log(`Opening folder: ${folder.get_uri()}`);
                    Gio.AppInfo.launch_default_for_uri(folder.get_uri(), null);
                }
            });

            this._customMenuItemFile = new PopupMenu.PopupMenuItem('Open .desktop file');
            this._customMenuItemFile.connect('activate', () => {
                const desktopInfo = this.app.get_app_info();
                const desktopFilePath = desktopInfo?.get_filename();

                if (!desktopFilePath) {
                    log('No .desktop file found for the selected app.');
                    return;
                }

                // Close the overview window
                if (Main.overview.visible) {
                    log('Hiding overview...');
                    Main.overview.hide();
                }

                // Open the folder containing the .desktop file
                const file = Gio.File.new_for_path(desktopFilePath);
                if (file) {
                    log(`Opening file: ${file.get_uri()}`);
                    Gio.AppInfo.launch_default_for_uri(file.get_uri(), null);
                }
            });

            // Add the custom menu item correctly
            this._menu.addMenuItem(this._customMenuItemFolder);
            this._menu.addMenuItem(this._customMenuItemFile);
        };
    }

    disable() {
        // Restore the original popupMenu method
        if (this._originalPopupMenu) {
            AppDisplay.AppIcon.prototype.popupMenu = this._originalPopupMenu;
            this._originalPopupMenu = null;
        }
    }
}