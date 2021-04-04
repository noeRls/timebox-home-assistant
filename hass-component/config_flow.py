from .const import DOMAIN
from homeassistant import config_entries
import homeassistant.helpers.config_validation as cv
from homeassistant.const import CONF_NAME, CONF_URL
import voluptuous as vol
import httpx
import logging

LOGGER = logging.getLogger(__name__)


CONF_MAC = "mac"

PLATFORM_SCHEMA = vol.Schema({
    vol.Required(CONF_URL): cv.string
})

TIMEBOX_SCHEMA = vol.Schema({
    vol.Required(CONF_MAC): cv.string,
    vol.Optional(CONF_NAME): cv.string
})


class TimeboxConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    def __init__(self):
        self.url = ""

    async def async_step_user(self, user_input = None):
        errors = {}
        if user_input is not None:
            self.url = user_input[CONF_URL]
            client = httpx.AsyncClient()
            try:
                await client.get(f"{self.url}/hello")
                return self.async_step_timebox()
            except Exception as e:
                LOGGER.error(e)
                errors["base"] = f"Failed to connect to Timebox server (url: \"{self.url}\")"
        return self.async_show_form(step_id="user", data_schema=PLATFORM_SCHEMA, errors=errors)

    async def async_step_timebox(self, user_input = None):
        errors = {}
        if user_input is not None:
            user_input[CONF_URL] = self.url
            mac = user_input[CONF_MAC]
            name = user_input[CONF_NAME]
            client = httpx.AsyncClient()
            try:
                await client.post(f"{self.url}/connect", data={"mac": mac})
                return self.async_create_entry(title=f"Timebox {name if name else mac}", data=user_input)
            except Exception as e:
                LOGGER.error(e)
                errors["base"] = f"Failed to connect to timebox \"{mac}\" (server \"{self.url}\")"
        return self.async_show_form(step_id="device", data_schema=TIMEBOX_SCHEMA, errors=errors)