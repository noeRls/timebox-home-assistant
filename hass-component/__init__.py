"""Timebox integration"""

from homeassistant import core, config_entries
from .const import DOMAIN

async def async_setup_entry(
    hass: core.HomeAssistant,
    entry: config_entries.ConfigEntry
):
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    hass.async_create_task(hass.config_entries.async_forward_entry_setup(entry, "timebox"))

    return True