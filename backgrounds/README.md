# Background Images

This folder contains background images for the Nomi extension's dynamic background system.

## Folder Structure

```
backgrounds/
├── bedroom/
│   ├── day.jpg
│   └── night.jpg
├── livingroom/
│   ├── day.jpg
│   └── night.jpg
└── outside/
    ├── day.jpg
    └── night.jpg
```

## Usage

- Place day and night versions of each location in their respective folders
- Images should be named `day.[ext]` and `night.[ext]`
- Supported formats: .jpg, .jpeg, .png, .webp
- Examples: `day.png`, `night.webp`, `day.jpg`, `night.jpeg`
- The extension automatically selects day/night based on current time (6 AM - 6 PM = day)
- If only one version exists (e.g., only `day.png`), it will be used for both day and night

## Background Commands

Commands are automatically generated based on your folder structure:

- `/{folder_name}` - Switch to that background (e.g., `/bedroom`, `/office`, `/cafe`)
- `/backgrounds` - List all available backgrounds
- `/reset` - Reset to default background
- `/time day|night` - Override time for current background
- `/brightness <0-100>` - Set background brightness (0=dark, 100=normal)
