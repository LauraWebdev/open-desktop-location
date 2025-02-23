import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as AppDisplay from 'resource:///org/gnome/shell/ui/appDisplay.js';
import Gio from 'gi://Gio';

export default class OpenDesktopLocationExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._originalPopupMenu = null;
        this._customMenuItemFolder = null;
        this._customMenuItemFile = null;
    }

    enable() {
        // Save the original popupMenu function to the prototype
        if (!this._originalPopupMenu) {
            this._originalPopupMenu = AppDisplay.AppIcon.prototype.popupMenu;
        }
        const originalPopupMenu = this._originalPopupMenu;

        // Since there is not proper API to add context menu functions to the AppIcons, we'll have to patch the popupMenu function instead
        AppDisplay.AppIcon.prototype.popupMenu = function (side = imports.gi.St.Side.LEFT) {
            originalPopupMenu.call(this, side);

            if (!this._menu) {
                console.log('No context menu found for the app icon.');
                return false;
            }

            const desktopInfo = this.app.get_app_info();
            const desktopFilePath = desktopInfo?.get_filename();
            if (!desktopFilePath) {
                console.log('No .desktop file found for the selected app.');
                return;
            }

            // Open folder action
            if (!this._customMenuItemFolder) {
                this._customMenuItemFolder = new PopupMenu.PopupMenuItem('Open .desktop location');
                this._customMenuItemFolder.connect('activate', () => {
                    if (Main.overview.visible) {
                        Main.overview.hide();
                    }

                    const folder = Gio.File.new_for_path(desktopFilePath).get_parent();
                    if (folder) {
                        console.log(`Opening folder: ${folder.get_uri()}`);
                        Gio.AppInfo.launch_default_for_uri(folder.get_uri(), null);
                    }
                });

                this._menu.addMenuItem(this._customMenuItemFolder);
            }

            // Open file action
            if(!this._customMenuItemFile) {
                this._customMenuItemFile = new PopupMenu.PopupMenuItem('Open .desktop file');
                this._customMenuItemFile.connect('activate', () => {
                    if (Main.overview.visible) {
                        Main.overview.hide();
                    }

                    const file = Gio.File.new_for_path(desktopFilePath);
                    if (file) {
                        console.log(`Opening file: ${file.get_uri()}`);
                        Gio.AppInfo.launch_default_for_uri(file.get_uri(), null);
                    }
                });

                this._menu.addMenuItem(this._customMenuItemFile);
            }
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