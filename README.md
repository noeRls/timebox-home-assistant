# Timebox Home Assistant
[Home Assistant](https://hass.io) custom component for Timebox-Evo

The only available and working libary to interact with the Timeboex-Evo is written in javascript: [node-divoom-timebox-evo](https://github.com/RomRider/node-divoom-timebox-evo).

In order to make it work with Home Assistant, I made it accessble via a web API.

# Installation

## Finding the mac address of your Timebox-Evo

These steps may vary depending of your blutooth setup:

- run `bluetoothctl`
- run `scan on`

It should output a list of blutooth devices. Write down the mac address of your Timebox-Evo

You can try to connect to it to ensure it will work
- run `connect MAC_ADDRESS`
> If you have the error `Failed to connect: org.bluez.Error.Failed` run `trust MAC_ADDRESS` and try again
- if it worked, disconnect the device, run `disconnect`

If you have any problem [this guide](https://www.pcsuggest.com/linux-bluetooth-setup-hcitool-bluez/) may help you troubleshoot your issues.

## Server

The server will communicate with the Timebox-Evo

The default server port is 5555, it can be override with the `PORT` environment variable

### Requirement

The server need to have blutooth to communicate with the Timebox-Evo.
It is recommended to run the server on the same machine as your home assistant.

### Installation with docker

Docker is the recommended way of installing the server

docker
```sh
docker run --network host noerls/timebox-home-assistant
```

docker-compose.yml
```yml
version: '3'

services:
  timebox-server:
    container_name: timebox-server
    image: noerls/timebox-home-assistant
    restart: unless-stopped
    network_mode: host
```

### Installation with npm

- clone the repository
- go in the `./server` folder
- run `npm install`. If you run into dependencies issues it's likely because you lack of blutooth dependencies
- run `npm build`

Then whenever you want to start the server run: `npm run-script start`

## Home Assistant custom component

### Install the component

- clone the repository
- copy the `timebox` folder into `HASS_CONFIG/custom_components/`

#### Enable the component

In your `configuration.yaml` add en entry
```yml
notify:
  - name: timebox
    platform: timebox
    mac: 11:75:58:F2:B2:2B
    image_dir: timebox-images
    url: http://localhost:5555
```

- `mac`: mac address of your timebox-evo
- `url`: url to the server
- `image_dir` (optinal): a directory, relative to the configuration dir.

# Usage

Here come the fun part, here is the list of possibility:
- displaying image from url
- displaying image from a local image
- changing the brightness
- displaying scrolling text
- switching to time channel

This custom component acts as a notify platform. This means that the Service Data requires a message parameter, even though we're not using it in all cases. Leave the message parameter blank, and specify TimeBox mode and other information in the data parameter of the Service Data payload.

## Display an image

### From a link
```
{
  "message": "",
  "data": {
    "mode": "image",
    "link": "https://example.com/picture.png"
  }
}
```

### From a local file
```
{
  "message": "",
  "data": {
    "mode": "image",
    "file-name": "picture.png"
  }
}
```
In order to use this you must specify an `image_dir` in the config

This will use the image `image_dir/FILENAME`

## Change the brightness
```
{
  "message": "",
  "data": {
    "mode": "brightness",
    "brightness": 50
  }
}
```
Change the brightness on a scale of 0 to 100

## Display text

```
{
  "message": "",
  "data": {
    "mode": "text",
    "text": "Hello, World!"
  }
}
```

## Display text (message parameter only)
If you only specify the message parameter, but leave the Service Data empty, it will automatically choose the text mode and display the message.
```
{
  "message": "Hello again, World!"
}
```

## Switch to time channel
```
{
  "message": "",
  "data": {
    "mode": "time"
  }
}
```

# Examples

Here are some examples from my configuration
### Update timebox with album cover when song change
```yml
- alias: Update timebox with album cover when song change
  description: ''
  trigger:
  - platform: state
    entity_id: media_player.spotify_noe_rivals
    attribute: entity_picture
  condition: []
  action:
  - service: notify.timebox
    data_template:
      message: ''
      data:
        mode: image
        link: 'http://localhost:8123{{ trigger.to_state.attributes.entity_picture }}'
  mode: single
```

### Change the brightness when watching the TV

```yml
- alias: Switch light off when casting something
  description: ''
  trigger:
    - platform: state
      entity_id: media_player.bedroom
      to: "playing"
  condition: []
  action:
  - service: notify.timebox
    data:
      message: ''
      data:
        mode: brightness
        brightness: 20

- alias: Switch light on when stoped casting
  description: ''
  trigger:
    - platform: state
      entity_id: media_player.bedroom
      from: "playing"
      to:
        - "paused"
        - "off"
      for: "00:00:10"
  condition: []
  action:
  - service: notify.timebox
    data:
      message: ''
      data:
        mode: brightness
        brightness: 100
```

# Credit

Bring thanks to [node-divoom-timebox-evo](https://github.com/RomRider/node-divoom-timebox-evo) library.

Custom component inspired from [homeassistant-timebox](https://bitbucket.org/pjhardy/homeassistant-timebox/src/master/).
