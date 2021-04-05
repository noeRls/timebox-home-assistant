"""
TimeBox platform for notify component.

Connects to a Divoom TimeBox over bluetooth.

Peter Hardy <peter@hardy.dropbear.id.au>
"""
import json, os

import logging

import voluptuous as vol

import homeassistant.helpers.config_validation as cv
from homeassistant.components.notify import (
    ATTR_DATA, PLATFORM_SCHEMA, BaseNotificationService)
from homeassistant.const import CONF_MAC

REQUIREMENTS = ['colour==0.1.5',
                'https://github.com/phardy/timebox/archive/'
                '8d9a5c8246961c32cffc521bbe7e9732cfa7b216.zip'
                '#timebox==0.1']

_LOGGER = logging.getLogger(__name__)

CONF_IMAGE_DIR = 'image_dir'

PARAM_MODE = 'mode'
PARAM_COLOR = 'color'
PARAM_IMAGE = 'image'
PARAM_IMAGE_FILE = 'image-file'
PARAM_FILE_NAME = 'file-name'

VALID_MODES = {'off', 'clock', 'temp', 'image', 'animation'}

PLATFORM_SCHEMA = PLATFORM_SCHEMA.extend({
    vol.Required(CONF_MAC): cv.string,
    vol.Required(CONF_IMAGE_DIR): cv.string,
})

def get_service(hass, config, discovery_info=None):
    """Get the TimeBox notification service."""
    image_dir = hass.config.path(config[CONF_IMAGE_DIR])
    return TimeBoxNotificationService(config[CONF_MAC],
                                      image_dir)

class TimeBoxNotificationService(BaseNotificationService):
    """Implement the notification service for TimeBox."""

    def __init__(self, mac, image_dir):
        from timebox import TimeBox
        self._mac = mac
        self._image_dir = image_dir
        self._timebox = TimeBox()
        self._timebox.connect(host=mac)
        if not os.path.isdir(image_dir):
            _LOGGER.error("image_dir {0} does not exist, timebox will not work".format(image_dir))

        self.display_image_file('ha-logo')


    def display_image_file(self, fn):
        image_data = self.load_image_file(fn)
        if image_data is not None:
            self.display_image(image_data)

    def display_image(self, image_data):
        if self.valid_image(image_data):
            from timeboximage import TimeBoxImage
            image = TimeBoxImage()
            image.image = image_data
            self._timebox.set_static_image(image)
        else:
            _LOGGER.error("Invalid image data received")

    def valid_color(self, color):
        """Verifies a color is valid
        (Array of three ints, range 0-15)"""
        valid = False
        if (isinstance(color, list) and len(color) == 3):
            valid = True
            for chan in color:
                valid = valid and (0 <= chan <= 15)
        if not valid:
            _LOGGER.warn("{0} was not a valid color".format(color))
        return valid

    def valid_image(self, image):
        """Verifies an image array is valid.
        An image should consist of a 2D array, 11x11. Each array
        element is again an arry, containing a valid colour
        (see valid_color())."""
        valid = False
        if (isinstance(image, list) and len(image) == 11):
            valid = True
            for row in image:
                if (isinstance(row, list) and len(row) == 11):
                    for pixel in row:
                        if not self.valid_color(pixel):
                            valid = False
                            break
                else:
                    valid = False
                    break
        if not valid:
            _LOGGER.error("Invalid image data received")
        return valid

    def load_image_file(self, image_file_name):
        """Loads image data from a file and returns it."""
        fn = os.path.join(self._image_dir,
                          "{0}.json".format(image_file_name))
        try:
            fh = open(fn)
        except:
            _LOGGER.error("Unable to open {0}".format(fn))
            return None
        try:
            image = json.load(fh)
            return image
        except Exception as e:
            _LOGGER.error("{0} does not contain a valid image in JSON format".format(fn))
            _LOGGER.error(e)
            return None

    def convert_color(self, color):
        """We expect all colors passed in to be in the range 0-15.
        But some parts of the timebox API expect 0-255. This function
        converts a passed in color array to something the API can
        work with. Does not do validation itself."""
        return [color[0]*16, color[1]*16, color[2]*16]

    def send_message(self, message="", **kwargs):
        if kwargs.get(ATTR_DATA) is None:
            _LOGGER.error("Service call needs a message type")
            return False
        data = kwargs.get(ATTR_DATA)
        mode = data.get(PARAM_MODE)
        # HA used to internally cast "off" to a boolean False.
        # Apparently it doesn't any more?
        if mode == False or mode == 'off':
            self.display_image_file('blank')

        elif mode == "clock":
            color = data.get(PARAM_COLOR)
            if self.valid_color(color):
                color = self.convert_color(color)
            else:
                color = [255, 255, 255]
            self._timebox.show_clock(color=color)

        elif mode == "temp":
            color = data.get(PARAM_COLOR)
            if self.valid_color(color):
                color = self.convert_color(color)
            else:
                color = [255, 255, 255]
            self._timebox.show_temperature(color=color)

        elif mode == "image":
            image_data = data.get(PARAM_IMAGE)
            self.display_image(image_data)

        elif mode == "image-file":
            image_filename = data.get(PARAM_FILE_NAME)
            self.display_image_file(image_filename)

        elif mode == "animation":
            # TODO
            pass

        else:
            _LOGGER.error("Invalid mode '{0}', must be one of 'off', 'clock', 'temp', 'image', 'animation'".format(mode))
            return False
        
        return True
