import { API } from 'homebridge';
import {ACCESSORY_NAME, PLUGIN_NAME} from './settings';
import { GarageDoorOpenerAccessory } from './platformAccessory';

export = (api: API) => {
  api.registerAccessory(PLUGIN_NAME, ACCESSORY_NAME, GarageDoorOpenerAccessory);
};
