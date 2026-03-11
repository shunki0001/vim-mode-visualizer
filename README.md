# Vim Mode Visualizer

A Visual Studio Code extension that enhances the editing experience when using **VSCodeVim**.

This extension provides two main features:

- Vim mode visualization (NORMAL / INSERT / VISUAL)
- Flexible line number display (Absolute / Relative / Hybrid)

---

# Features

## 1. Vim Mode Indicator

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

# 2. Advanced Line Number Display

VSCode normally supports either:

- Absolute line numbers
- Relative line numbers

This extension supports multiple line number modes.

### Supported modes

| Mode | Description |
|-----|-----|
| Absolute | Standard VSCode line numbers |
| Relative | Relative numbers from cursor |
| Hybrid | Absolute + Relative numbers |

---

## Hybrid Mode Example

```
15 2
16 1
17 0
18 1
19 2
```

Where:

- First number → Absolute line number
- Second number → Relative distance from the cursor

This is especially useful for Vim motion commands such as:

```
5j
3k
d4j
```

---

# Line Number Mode Switching

Line number display modes can be changed via command.

Command:

```
LineNumberMode: Set Line Number Mode
```

Available options:

- Absolute
- Relative
- Hybrid

---

# Requirements

This extension requires the following extension:

VSCodeVim  
https://marketplace.visualstudio.com/items?itemName=vscodevim.vim

---

# Extension Settings

## Vim Mode

Enable inline mode indicator

```
vimModeVisualizer.enableInline
```

Enable popup notification when mode changes

```
vimModeVisualizer.enableNotification
```

---

## Line Number Mode

Set the default line number mode

```
vimModeVisualizer.lineNumberMode
```

Supported values:

```
Absolute
Relative
Hybrid
```

---

# Commands

## Show Vim Mode

```
vim-mode-visualizer.showMode
```

Used internally to update the displayed Vim mode.

---

## Set Line Number Mode

```
lineNumberMode.setLineNumberMode
```

Opens a selector to change the line number display mode.

---

# Known Issues

- Wrapped lines may visually overlap with custom line numbers.
- This is due to VSCode decoration rendering behavior.

Future versions may improve this behavior.

---

# Architecture

The extension follows a Controller / Renderer architecture.

```
extension.ts
     │
     ├── ModeController
     │
     └── LineNumberController
             │
             └── LineNumberRenderer
```

Benefits:

- Clear separation of responsibilities
- Easier performance optimization
- Improved maintainability

---

# Release Notes

## 0.0.7

Major update

### Added

- Relative line numbers
- Hybrid line number mode (Absolute + Relative)
- Line number mode switching command

### Improved

- Line number rendering architecture
- Controller / Renderer separation
- Cleaner rendering logic

### Performance

- Visible range optimization
- Reduced unnecessary updates

---

## 0.0.3

### Fixed

- Extension activation issue