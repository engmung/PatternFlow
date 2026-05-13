Place your .pfv files in this directory.

They will be uploaded to the ESP32 FATFS partition using:
  Arduino IDE → Tools → ESP32 Sketch Data Upload

Requirements:
  - Install "ESP32 Sketch Data Upload" plugin for Arduino IDE
  - Board partition must include a FATFS partition (e.g., "16M Flash (3MB APP/9.9MB FATFS)")
  - Total .pfv file size must fit within the FATFS partition (~9.9 MB)

File naming:
  - Use simple names: clip1.pfv, fire.pfv, ocean.pfv
  - Avoid spaces and special characters
