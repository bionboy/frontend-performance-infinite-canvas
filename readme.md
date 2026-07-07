# Mini Editor

A lightweight canvas-style editor for exploring high-volume shape rendering, selection, drag interactions, and property editing in React.

This repo is a performance exercise: the core constraint is keeping canvas drag interactions smooth while thousands of nodes are present.

## Performance Goals

- Smooth dragging with thousands of nodes.
- Canvas updates are isolated to the shapes affected by a drag.
- Layers and properties panels avoid subscribing to drag-frame position updates.
- Properties panel refreshes after drag end, selection changes, or direct property edits.

## Commands

- `pnpm install`
- `pnpm dev`
- `pnpm build`

<img width="964" height="819" alt="image" src="https://github.com/user-attachments/assets/b1fe21c9-2449-49e3-8bd2-75769f4cc287" />
