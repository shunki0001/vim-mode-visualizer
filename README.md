# Vim Mode Visualizer

A Visual Studio Code extension that enhances the editing experience when using **VSCodeVim**.

This extension provides two main features:

- Vim mode visualization (NORMAL / INSERT / VISUAL)
- Relative + Absolute line number display

---

## Features

### 1. Vim Mode Indicator

Displays the current Vim mode directly in the editor.

Supported modes:

- NORMAL
- INSERT
- VISUAL

Features:

- Inline mode indicator near the cursor
- Optional popup notification
- Customizable colors per mode

This allows users to quickly understand their current editing mode without relying on the status bar.

---

### 2. Relative + Absolute Line Numbers

VSCode normally supports either:

- Absolute line numbers
- Relative line numbers

This extension allows displaying **both simultaneously**.

Example:
```
15 2
16 1
17 0
18 1
19 2
```


Where:

- First number → Absolute line number
- Second number → Relative line number from the cursor

This is especially useful for Vim users performing motion commands such as:
```
5j
3k
d4j
```

---

## Requirements

This extension requires the following extension:

- VSCodeVim  
  https://marketplace.visualstudio.com/items?itemName=vscodevim.vim

---

## Extension Settings

### Vim Mode

Enable inline mode indicator:

---

## Requirements

This extension requires the following extension:

- VSCodeVim  
  https://marketplace.visualstudio.com/items?itemName=vscodevim.vim

---

## Extension Settings

### Vim Mode

Enable inline mode indicator:

vimModeVisualizer.enableInline

Enable popup notifications when changes;

vimModeVisualizer.enableNotification


---

## Commands

The following command is used internally:

vim-mode-visualizer.showMode


Used to update the displayed Vim mode.

---

## Known Issues

- Wrapped lines may visually overlap with custom line numbers.
- This is due to VSCode decoration rendering behavior.

Future versions may improve this behavior.

---

## Release Notes

### 0.0.7

Major update

#### Added

- Relative + Absolute line number display
- Visible range optimization for line number rendering
- Decoration based line number system

#### Improved

- Performance improvements for line updates
- Cleaner rendering logic

---

### 0.0.3

#### Fixed

- Extension activation issue